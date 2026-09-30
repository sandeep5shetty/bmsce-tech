import { and, eq, inArray } from "drizzle-orm";

import db from "@/db";
import { quizEventMaterial, quizEventMaterialChunk } from "@/db/schema";

import { cosineSimilarity, embedQuery } from "./material-embeddings";

export interface RetrievedMaterialChunk {
  chunkId: string;
  materialId: string;
  fileName: string;
  chunkIndex: number;
  pageNumber: number | null;
  slideNumber: number | null;
  text: string;
  score: number;
}

export async function retrieveMaterialChunksForTopic(params: {
  eventId: string;
  topic: string;
  materialIds?: string[];
  limit?: number;
}): Promise<RetrievedMaterialChunk[]> {
  const limit = params.limit ?? 12;

  const materialFilters = [
    eq(quizEventMaterial.eventId, params.eventId),
    eq(quizEventMaterial.status, "ready"),
  ];
  if (params.materialIds?.length) {
    materialFilters.push(inArray(quizEventMaterial.id, params.materialIds));
  }

  const materials = await db.query.quizEventMaterial.findMany({
    where: and(...materialFilters),
    columns: { id: true, fileName: true },
  });

  if (materials.length === 0) return [];

  const materialIdSet = new Set(materials.map((m) => m.id));
  const fileNameById = new Map(materials.map((m) => [m.id, m.fileName]));

  const chunks = await db.query.quizEventMaterialChunk.findMany({
    where: and(
      eq(quizEventMaterialChunk.eventId, params.eventId),
      inArray(quizEventMaterialChunk.materialId, [...materialIdSet]),
    ),
    columns: {
      id: true,
      materialId: true,
      chunkIndex: true,
      pageNumber: true,
      slideNumber: true,
      text: true,
      embedding: true,
    },
  });

  const queryEmbedding = await embedQuery(params.topic);

  const scored: RetrievedMaterialChunk[] = [];
  for (const chunk of chunks) {
    const embedding = chunk.embedding;
    if (!embedding || embedding.length === 0) continue;
    const score = cosineSimilarity(queryEmbedding, embedding);
    scored.push({
      chunkId: chunk.id,
      materialId: chunk.materialId,
      fileName: fileNameById.get(chunk.materialId) ?? "Material",
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      slideNumber: chunk.slideNumber,
      text: chunk.text,
      score,
    });
  }

  const sorted = scored.sort((a, b) => b.score - a.score);

  // When the user picked specific files, send every indexed chunk from them
  // (topic ranking only orders the prompt). Semantic top-K alone hides content
  // and caps how many grounded questions are possible.
  if (params.materialIds?.length) {
    const selected = new Set(params.materialIds);
    const fromSelection = sorted.filter((c) => selected.has(c.materialId));
    if (fromSelection.length > 0) {
      return fromSelection.slice(0, Math.max(limit, fromSelection.length));
    }
  }

  return sorted.slice(0, limit);
}
