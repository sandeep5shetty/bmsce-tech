"use server";

import { revalidatePath } from "next/cache";

import { asc, count, desc, eq, sql } from "drizzle-orm";

import { sendEmail } from "@/lib/email";
import {
  deleteS3ObjectByUrl,
  experienceUploadKeyFromUrl,
  isS3Configured,
} from "@/lib/s3/storage";

import { getUser } from "@/actions/user";

import db from "@/db";
import {
  interviewExperience,
  interviewExperienceComment,
  interviewExperienceResource,
  interviewExperienceRound,
} from "@/db/schema";

import {
  CommentWithAuthor,
  ExperienceListItem,
  ExperienceWithAuthor,
} from "./types";
import {
  CreateExperienceInput,
  PostCommentInput,
  RoundOutcome,
  roundOutcomeOptions,
} from "./validation";

const knownOutcomes = new Set<string>(roundOutcomeOptions);

/** Legacy rounds predate the outcome column, so anything unknown reads as null. */
function normalizeOutcome(value: string | null): RoundOutcome | null {
  return value && knownOutcomes.has(value) ? (value as RoundOutcome) : null;
}

export async function createExperience(data: CreateExperienceInput) {
  const currentUser = await getUser();
  if (!currentUser) throw new Error("Unauthorized");

  const [experience] = await db
    .insert(interviewExperience)
    .values({
      authorId: currentUser.id,
      driveId: data.driveId || null,
      companyName: data.companyName,
      companyLogoUrl: data.companyLogoUrl || null,
      role: data.role,
      batch: data.batch,
      result: data.result,
      ctcLpa: data.ctcLpa ?? null,
      overview: data.overview,
      preparationResources: data.preparationResources || null,
      jdUrl: data.jd?.url ?? null,
      jdFileName: data.jd?.fileName ?? null,
    })
    .returning();

  if (!experience) throw new Error("Failed to create experience");

  await db.insert(interviewExperienceRound).values(
    data.rounds.map((round) => ({
      experienceId: experience.id,
      roundNumber: round.roundNumber,
      roundType: round.roundType,
      description: round.description,
      difficulty: round.difficulty ?? null,
      outcome: round.outcome ?? null,
    })),
  );

  if (data.resources.length > 0) {
    await db.insert(interviewExperienceResource).values(
      data.resources.map((r) => ({
        experienceId: experience.id,
        type: r.type,
        title: r.title,
        content: r.url,
        fileName: r.fileName,
        fileSize: r.fileSize,
      })),
    );
  }

  revalidatePath("/experiences");
  return experience;
}

export async function getAllExperiences(): Promise<ExperienceListItem[]> {
  const [rows, roundRows, resourceCounts, commentCounts] = await Promise.all([
    db
      .select()
      .from(interviewExperience)
      .where(eq(interviewExperience.isPublished, true))
      .orderBy(desc(interviewExperience.createdAt)),
    // Pulled in full rather than aggregated in SQL because the listing card
    // renders a per-round outcome rail, not just a round count.
    db
      .select({
        experienceId: interviewExperienceRound.experienceId,
        outcome: interviewExperienceRound.outcome,
      })
      .from(interviewExperienceRound)
      .orderBy(asc(interviewExperienceRound.roundNumber)),
    db
      .select({
        experienceId: interviewExperienceResource.experienceId,
        resourceCount: count(interviewExperienceResource.id),
      })
      .from(interviewExperienceResource)
      .groupBy(interviewExperienceResource.experienceId),
    db
      .select({
        experienceId: interviewExperienceComment.experienceId,
        commentCount: count(interviewExperienceComment.id),
      })
      .from(interviewExperienceComment)
      .groupBy(interviewExperienceComment.experienceId),
  ]);

  const authorIds = [...new Set(rows.map((r) => r.authorId))];
  const authors = authorIds.length
    ? await db.query.user.findMany({
        where: (u, { inArray }) => inArray(u.id, authorIds),
        columns: { id: true, name: true, image: true },
      })
    : [];
  const authorById = new Map(authors.map((a) => [a.id, a]));

  const outcomesById = new Map<string, (RoundOutcome | null)[]>();
  for (const round of roundRows) {
    const outcome = normalizeOutcome(round.outcome);
    const existing = outcomesById.get(round.experienceId);
    if (existing) existing.push(outcome);
    else outcomesById.set(round.experienceId, [outcome]);
  }

  const resourceCountById = new Map(
    resourceCounts.map((r) => [r.experienceId, r.resourceCount]),
  );
  const commentCountById = new Map(
    commentCounts.map((c) => [c.experienceId, c.commentCount]),
  );

  return rows.map((row) => {
    const roundOutcomes = outcomesById.get(row.id) ?? [];
    return {
      ...row,
      author: authorById.get(row.authorId) ?? {
        id: row.authorId,
        name: null,
        image: null,
      },
      roundCount: roundOutcomes.length,
      clearedRoundCount: roundOutcomes.filter((o) => o === "Cleared").length,
      roundOutcomes,
      resourceCount: resourceCountById.get(row.id) ?? 0,
      commentCount: commentCountById.get(row.id) ?? 0,
    };
  });
}

export async function getExperienceStats() {
  const [[experienceStats], [resourceStats], [commentStats], [roundStats]] =
    await Promise.all([
      db
        .select({
          total: count(interviewExperience.id),
          companies: count(
            sql<string>`distinct ${interviewExperience.companyName}`,
          ),
        })
        .from(interviewExperience)
        .where(eq(interviewExperience.isPublished, true)),
      db.select({ total: count() }).from(interviewExperienceResource),
      db.select({ total: count() }).from(interviewExperienceComment),
      db.select({ total: count() }).from(interviewExperienceRound),
    ]);

  return {
    experienceCount: experienceStats?.total ?? 0,
    companyCount: experienceStats?.companies ?? 0,
    resourceCount: resourceStats?.total ?? 0,
    commentCount: commentStats?.total ?? 0,
    roundCount: roundStats?.total ?? 0,
  };
}

export async function getExperience(
  id: string,
): Promise<ExperienceWithAuthor | null> {
  const experience = await db.query.interviewExperience.findFirst({
    where: eq(interviewExperience.id, id),
    with: {
      author: { columns: { id: true, name: true, image: true } },
      rounds: { orderBy: (r) => [asc(r.roundNumber)] },
      resources: { orderBy: (r) => [asc(r.createdAt)] },
    },
  });

  return experience ?? null;
}

export async function deleteExperience(id: string) {
  const currentUser = await getUser();
  if (!currentUser) throw new Error("Unauthorized");

  const experience = await db.query.interviewExperience.findFirst({
    where: eq(interviewExperience.id, id),
    columns: { authorId: true, jdUrl: true, companyLogoUrl: true },
    with: { resources: { columns: { content: true } } },
  });
  if (!experience) throw new Error("Experience not found");
  if (experience.authorId !== currentUser.id) {
    throw new Error("You can only delete your own experience");
  }

  await db.delete(interviewExperience).where(eq(interviewExperience.id, id));

  // Best-effort S3 cleanup so deleting a writeup doesn't leave its uploaded
  // logo and documents orphaned in the bucket. The DB row is already gone at
  // this point, so a storage failure must not surface as a failed delete.
  const uploadedUrls = [
    experience.jdUrl,
    experience.companyLogoUrl,
    ...experience.resources.map((r) => r.content),
  ].filter((url): url is string => Boolean(url));

  if (uploadedUrls.length > 0 && isS3Configured()) {
    await Promise.all(
      uploadedUrls.map(async (url) => {
        if (!experienceUploadKeyFromUrl(url)) return;
        try {
          await deleteS3ObjectByUrl(url);
        } catch (error) {
          console.error("Failed to delete experience upload from S3:", error);
        }
      }),
    );
  }

  revalidatePath("/experiences");
}

export async function getComments(
  experienceId: string,
): Promise<CommentWithAuthor[]> {
  return db.query.interviewExperienceComment.findMany({
    where: eq(interviewExperienceComment.experienceId, experienceId),
    orderBy: (c) => [asc(c.createdAt)],
    with: { author: { columns: { id: true, name: true, image: true } } },
  });
}

export async function postComment(
  data: PostCommentInput,
): Promise<CommentWithAuthor> {
  const currentUser = await getUser();
  if (!currentUser) throw new Error("Unauthorized");

  const [comment] = await db
    .insert(interviewExperienceComment)
    .values({
      experienceId: data.experienceId,
      authorId: currentUser.id,
      body: data.body,
    })
    .returning();

  if (!comment) throw new Error("Failed to post question");

  const experience = await db.query.interviewExperience.findFirst({
    where: eq(interviewExperience.id, data.experienceId),
    with: { author: { columns: { id: true, name: true, email: true } } },
  });

  if (experience && experience.author.id !== currentUser.id) {
    try {
      await sendEmail({
        to: experience.author.email,
        subject: `New question on your ${experience.companyName} placement experience`,
        text: `${currentUser.name ?? "Someone"} asked a question on your ${experience.companyName} experience:\n\n"${data.body}"\n\nReply on bmsce.tech: ${process.env.NEXT_PUBLIC_APP_URL ?? ""}/experiences/${experience.id}`,
      });
    } catch (error) {
      console.error("Failed to send question notification email:", error);
    }
  }

  revalidatePath(`/experiences/${data.experienceId}`);
  return { ...comment, author: currentUser };
}

export async function deleteComment(id: string) {
  const currentUser = await getUser();
  if (!currentUser) throw new Error("Unauthorized");

  const comment = await db.query.interviewExperienceComment.findFirst({
    where: eq(interviewExperienceComment.id, id),
    columns: { authorId: true, experienceId: true },
  });
  if (!comment) throw new Error("Question not found");
  if (comment.authorId !== currentUser.id && !currentUser.isCoordinator) {
    throw new Error("You can only delete your own question");
  }

  await db
    .delete(interviewExperienceComment)
    .where(eq(interviewExperienceComment.id, id));

  revalidatePath(`/experiences/${comment.experienceId}`);
}

export async function setExperienceVerified(id: string, verified: boolean) {
  const currentUser = await getUser();
  if (!currentUser?.isCoordinator) {
    throw new Error("Coordinator access required");
  }

  await db
    .update(interviewExperience)
    .set({
      isVerified: verified,
      verifiedBy: verified ? currentUser.id : null,
      verifiedAt: verified ? new Date() : null,
    })
    .where(eq(interviewExperience.id, id));

  revalidatePath("/experiences");
  revalidatePath(`/experiences/${id}`);
}
