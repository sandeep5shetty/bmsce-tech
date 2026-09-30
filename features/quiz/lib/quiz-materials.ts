import { and, desc, eq } from "drizzle-orm";

import db from "@/db";
import {
  quizEventMaterial,
  quizEventMaterialChunk,
} from "@/db/schema";
import {
  QUIZ_MATERIAL_CONTENT_TYPES,
  type QuizMaterialFileType,
  buildQuizEventMaterialKey,
  deleteS3ObjectByKey,
  getS3ObjectBuffer,
  isQuizEventMaterialKey,
  uploadQuizMaterialBuffer,
} from "@/lib/s3/storage";

import { QuizApiError } from "./auth";
import {
  ensureQuizMaterialTables,
  formatQuizMaterialDbError,
  isMissingQuizMaterialTableError,
} from "./ensure-quiz-material-schema";
import { buildChunksFromSegments } from "./material-chunk";
import { embedTexts } from "./material-embeddings";
import { extractMaterialSegments } from "./material-extract";

const MAX_MATERIAL_BYTES = 25 * 1024 * 1024;

export function inferQuizMaterialType(
  fileName: string,
  mimeType: string,
): QuizMaterialFileType | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf" || mimeType === QUIZ_MATERIAL_CONTENT_TYPES.pdf) {
    return "pdf";
  }
  if (ext === "docx" || mimeType === QUIZ_MATERIAL_CONTENT_TYPES.docx) {
    return "docx";
  }
  if (ext === "pptx" || mimeType === QUIZ_MATERIAL_CONTENT_TYPES.pptx) {
    return "pptx";
  }
  return null;
}

function serializeMaterial(row: typeof quizEventMaterial.$inferSelect) {
  return {
    id: row.id,
    event_id: row.eventId,
    file_name: row.fileName,
    content_type: row.contentType,
    status: row.status,
    error: row.error,
    chunk_count: row.chunkCount,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

async function withMaterialSchema<T>(fn: () => Promise<T>): Promise<T> {
  try {
    await ensureQuizMaterialTables();
    return await fn();
  } catch (error) {
    if (isMissingQuizMaterialTableError(error)) {
      await ensureQuizMaterialTables();
      return await fn();
    }
    throw error;
  }
}

export async function listQuizEventMaterials(eventId: string) {
  return withMaterialSchema(async () => {
    const rows = await db.query.quizEventMaterial.findMany({
      where: eq(quizEventMaterial.eventId, eventId),
      orderBy: desc(quizEventMaterial.createdAt),
    });
    return rows.map(serializeMaterial);
  });
}

export async function indexQuizMaterial(materialId: string): Promise<void> {
  const material = await db.query.quizEventMaterial.findFirst({
    where: eq(quizEventMaterial.id, materialId),
  });

  if (!material) {
    throw new QuizApiError("NOT_FOUND", "Material not found.", 404);
  }

  await db
    .update(quizEventMaterial)
    .set({ status: "indexing", error: null, updatedAt: new Date() })
    .where(eq(quizEventMaterial.id, materialId));

  try {
    if (!isQuizEventMaterialKey(material.s3Key)) {
      throw new Error("Invalid material storage key.");
    }

    const { body } = await getS3ObjectBuffer(material.s3Key);
    const fileType = inferQuizMaterialType(
      material.fileName,
      material.contentType,
    );
    if (!fileType) {
      throw new Error("Unsupported material type.");
    }

    const segments = await extractMaterialSegments(body, fileType);
    const chunks = buildChunksFromSegments(segments);
    if (chunks.length === 0) {
      throw new Error("No readable text found in this document.");
    }

    await db
      .delete(quizEventMaterialChunk)
      .where(eq(quizEventMaterialChunk.materialId, materialId));

    const embeddings = await embedTexts(chunks.map((c) => c.text));

    await db.insert(quizEventMaterialChunk).values(
      chunks.map((chunk, index) => ({
        materialId: material.id,
        eventId: material.eventId,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber ?? null,
        slideNumber: chunk.slideNumber ?? null,
        text: chunk.text,
        embedding: embeddings[index],
        tokenCount: chunk.tokenCount,
      })),
    );

    await db
      .update(quizEventMaterial)
      .set({
        status: "ready",
        error: null,
        chunkCount: chunks.length,
        updatedAt: new Date(),
      })
      .where(eq(quizEventMaterial.id, materialId));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to index material.";
    await db
      .update(quizEventMaterial)
      .set({
        status: "failed",
        error: message,
        updatedAt: new Date(),
      })
      .where(eq(quizEventMaterial.id, materialId));
    throw error;
  }
}

export async function uploadAndIndexQuizMaterial(params: {
  eventId: string;
  adminId: string;
  fileName: string;
  contentType: string;
  buffer: Buffer;
}) {
  if (params.buffer.byteLength > MAX_MATERIAL_BYTES) {
    throw new QuizApiError(
      "VALIDATION_ERROR",
      "Document must be 25 MB or smaller.",
      400,
      "file",
    );
  }

  const fileType = inferQuizMaterialType(params.fileName, params.contentType);
  if (!fileType) {
    throw new QuizApiError(
      "VALIDATION_ERROR",
      "Only PDF, DOCX, and PPTX files are allowed.",
      400,
      "file",
    );
  }

  const materialId = crypto.randomUUID();
  const s3Key = buildQuizEventMaterialKey(
    params.eventId,
    materialId,
    fileType,
  );

  return withMaterialSchema(async () => {
    let row: typeof quizEventMaterial.$inferSelect;
    try {
      const [inserted] = await db
        .insert(quizEventMaterial)
        .values({
          id: materialId,
          eventId: params.eventId,
          adminId: params.adminId,
          fileName: params.fileName,
          contentType: QUIZ_MATERIAL_CONTENT_TYPES[fileType],
          s3Key,
          status: "pending",
        })
        .returning();

      if (!inserted) {
        throw new QuizApiError("SERVER_ERROR", "Failed to save material.", 500);
      }
      row = inserted;
    } catch (error) {
      throw new QuizApiError(
        "SERVER_ERROR",
        formatQuizMaterialDbError(error),
        500,
      );
    }

    try {
      await uploadQuizMaterialBuffer({
        key: s3Key,
        body: params.buffer,
        contentType: QUIZ_MATERIAL_CONTENT_TYPES[fileType],
        maxBytes: MAX_MATERIAL_BYTES,
      });
    } catch (error) {
      if (isQuizEventMaterialKey(s3Key)) {
        try {
          await deleteS3ObjectByKey(s3Key);
        } catch {
          // Best-effort cleanup.
        }
      }
      await db
        .delete(quizEventMaterial)
        .where(eq(quizEventMaterial.id, materialId))
        .catch(() => undefined);

      if (error instanceof QuizApiError) throw error;
      throw new QuizApiError(
        "UPLOAD_FAILED",
        error instanceof Error ? error.message : "Failed to upload material.",
        500,
      );
    }

    try {
      await indexQuizMaterial(materialId);
    } catch {
      const failedRow = await db.query.quizEventMaterial.findFirst({
        where: eq(quizEventMaterial.id, materialId),
      });
      if (failedRow) {
        return serializeMaterial(failedRow);
      }
      throw new QuizApiError(
        "INDEX_FAILED",
        "Material was uploaded but indexing failed.",
        500,
      );
    }

    const updated = await db.query.quizEventMaterial.findFirst({
      where: eq(quizEventMaterial.id, materialId),
    });

    return serializeMaterial(updated ?? row);
  });
}

export async function deleteQuizEventMaterial(
  eventId: string,
  materialId: string,
) {
  return withMaterialSchema(async () => {
  const material = await db.query.quizEventMaterial.findFirst({
    where: and(
      eq(quizEventMaterial.id, materialId),
      eq(quizEventMaterial.eventId, eventId),
    ),
  });

  if (!material) {
    throw new QuizApiError("NOT_FOUND", "Material not found.", 404);
  }

  if (isQuizEventMaterialKey(material.s3Key)) {
    try {
      await deleteS3ObjectByKey(material.s3Key);
    } catch {
      // Best-effort S3 cleanup.
    }
  }

  await db
    .delete(quizEventMaterial)
    .where(eq(quizEventMaterial.id, materialId));

  return { deleted: true };
  });
}

export async function retryQuizMaterialIndexing(
  eventId: string,
  materialId: string,
) {
  return withMaterialSchema(async () => {
  const material = await db.query.quizEventMaterial.findFirst({
    where: and(
      eq(quizEventMaterial.id, materialId),
      eq(quizEventMaterial.eventId, eventId),
    ),
  });

  if (!material) {
    throw new QuizApiError("NOT_FOUND", "Material not found.", 404);
  }

  await indexQuizMaterial(materialId);

  const updated = await db.query.quizEventMaterial.findFirst({
    where: eq(quizEventMaterial.id, materialId),
  });

  if (!updated) {
    throw new QuizApiError("NOT_FOUND", "Material not found.", 404);
  }

  return serializeMaterial(updated);
  });
}
