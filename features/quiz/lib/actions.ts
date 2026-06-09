"use server";

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  sql,
} from "drizzle-orm";

import db from "@/db";
import {
  quizAnalyticsSnapshot,
  quizAnswerOption,
  quizEvent,
  quizJoinCodeHistory,
  quizParticipantAnswer,
  quizQuestion,
  quizSession,
  quizSessionParticipant,
} from "@/db/schema";

import { generateAnalyticsSnapshots, generateSessionCsv } from "./analytics";
import { QuizApiError, requireAdmin } from "./auth";
import { broadcastSessionEvent } from "./realtime";
import { calculateScore } from "./scoring";
import type {
  CurrentQuestionPayload,
  LeaderboardEntry,
  QuizSessionStatus,
} from "./types";
import {
  serializeQuizAnswerOption,
  serializeQuizEvent,
  serializeQuizQuestion,
  serializeQuizSession,
  serializeQuizAnalyticsSnapshot,
} from "./types";
import type {
  CreateEventInput,
  CreateQuestionInput,
  CreateSessionInput,
  JoinSessionInput,
  PublishEventInput,
  SubmitAnswerInput,
  UpdateEventInput,
} from "./validation";
import { validateDisplayName } from "./validation";

const ACTIVE_SESSION_STATUSES = [
  "countdown",
  "question",
  "results",
  "leaderboard",
  "final_leaderboard",
] as const;

const LIVE_QUESTION_STATUSES = [
  "countdown",
  "question",
  "results",
  "leaderboard",
] as const;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function generateUniqueJoinCode(eventId: string): Promise<string | null> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateJoinCode();
    const existing = await db.query.quizJoinCodeHistory.findFirst({
      where: and(
        eq(quizJoinCodeHistory.eventId, eventId),
        eq(quizJoinCodeHistory.joinCode, code),
      ),
      columns: { id: true },
    });
    if (!existing) return code;
  }
  return null;
}

async function getOwnedEvent(adminId: string, eventId: string) {
  return db.query.quizEvent.findFirst({
    where: and(eq(quizEvent.id, eventId), eq(quizEvent.adminId, adminId)),
  });
}

async function endLobbySessions(eventId: string) {
  await db
    .update(quizSession)
    .set({ status: "ended", endedAt: new Date() })
    .where(and(eq(quizSession.eventId, eventId), eq(quizSession.status, "lobby")));
}

// ── Events ─────────────────────────────────────────────────────────────────

export async function listQuizEvents() {
  const admin = await requireAdmin();
  const events = await db.query.quizEvent.findMany({
    where: eq(quizEvent.adminId, admin.id),
    orderBy: desc(quizEvent.createdAt),
  });
  return events.map(serializeQuizEvent);
}

export async function createQuizEvent(data: CreateEventInput) {
  const admin = await requireAdmin();
  try {
    const [event] = await db
      .insert(quizEvent)
      .values({
        adminId: admin.id,
        title: data.title.trim(),
        description: data.description ?? null,
        status: "draft",
      })
      .returning();
    if (!event) throw new QuizApiError("CREATE_FAILED", "Failed to create event. Please try again.", 500);
    return serializeQuizEvent(event);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new QuizApiError(
        "DUPLICATE_EVENT_TITLE",
        "An event with this title already exists.",
        409,
        "title",
      );
    }
    throw error;
  }
}

export async function getQuizEvent(eventId: string) {
  const admin = await requireAdmin();
  const event = await getOwnedEvent(admin.id, eventId);
  if (!event) {
    throw new QuizApiError("EVENT_NOT_FOUND", "Event not found.", 404);
  }
  return serializeQuizEvent(event);
}

export async function updateQuizEvent(eventId: string, data: UpdateEventInput) {
  const admin = await requireAdmin();
  const existing = await getOwnedEvent(admin.id, eventId);
  if (!existing) {
    throw new QuizApiError("EVENT_NOT_FOUND", "Event not found.", 404);
  }

  const updates: Partial<typeof quizEvent.$inferInsert> = {};
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.description !== undefined) updates.description = data.description;
  if (data.theme_id !== undefined) updates.themeId = data.theme_id ?? "default";
  if (data.custom_theme !== undefined) updates.customTheme = data.custom_theme;
  if (data.logo_url !== undefined) updates.logoUrl = data.logo_url;

  try {
    const [event] = await db
      .update(quizEvent)
      .set(updates)
      .where(and(eq(quizEvent.id, eventId), eq(quizEvent.adminId, admin.id)))
      .returning();
    if (!event) throw new QuizApiError("UPDATE_FAILED", "Failed to update event. Please try again.", 500);
    return serializeQuizEvent(event);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new QuizApiError(
        "DUPLICATE_EVENT_TITLE",
        "An event with this title already exists.",
        409,
        "title",
      );
    }
    throw error;
  }
}

export async function deleteQuizEvent(eventId: string) {
  const admin = await requireAdmin();
  const event = await getOwnedEvent(admin.id, eventId);
  if (!event) {
    throw new QuizApiError("EVENT_NOT_FOUND", "Event not found.", 404);
  }

  const active = await db.query.quizSession.findFirst({
    where: and(
      eq(quizSession.eventId, eventId),
      inArray(quizSession.status, [...ACTIVE_SESSION_STATUSES]),
    ),
    columns: { id: true },
  });

  if (active) {
    throw new QuizApiError(
      "SESSION_ACTIVE",
      "Cannot delete an event with an active session. End the session first.",
      409,
    );
  }

  await endLobbySessions(eventId);
  await db
    .delete(quizEvent)
    .where(and(eq(quizEvent.id, eventId), eq(quizEvent.adminId, admin.id)));
}

export async function publishQuizEvent(eventId: string, data: PublishEventInput) {
  const admin = await requireAdmin();
  const event = await getOwnedEvent(admin.id, eventId);
  if (!event) {
    throw new QuizApiError("EVENT_NOT_FOUND", "Event not found.", 404);
  }

  if (data.action === "publish") {
    const [{ value: questionCount }] = await db
      .select({ value: count() })
      .from(quizQuestion)
      .where(eq(quizQuestion.eventId, eventId));

    if (!questionCount) {
      throw new QuizApiError(
        "EVENT_HAS_NO_QUESTIONS",
        "Cannot publish an event with no questions. Add at least one question first.",
        422,
      );
    }

    const joinCode = await generateUniqueJoinCode(eventId);
    if (!joinCode) {
      throw new QuizApiError(
        "SERVER_ERROR",
        "Failed to generate a unique join code. Please try again.",
        500,
      );
    }

    await db.insert(quizJoinCodeHistory).values({
      eventId,
      joinCode,
      issuedAt: new Date(),
    });

    const [updated] = await db
      .update(quizEvent)
      .set({ status: "published", joinCode })
      .where(and(eq(quizEvent.id, eventId), eq(quizEvent.adminId, admin.id)))
      .returning();

    if (!updated) {
      throw new QuizApiError("SERVER_ERROR", "Failed to publish event.", 500);
    }
    return serializeQuizEvent(updated);
  }

  if (event.status !== "published") {
    throw new QuizApiError(
      "EVENT_NOT_PUBLISHED",
      "Event is not currently published.",
      409,
    );
  }

  const active = await db.query.quizSession.findFirst({
    where: and(
      eq(quizSession.eventId, eventId),
      inArray(quizSession.status, [...ACTIVE_SESSION_STATUSES]),
    ),
    columns: { id: true },
  });

  if (active) {
    throw new QuizApiError(
      "SESSION_ACTIVE",
      "Cannot unpublish an event with an active session. End the session first.",
      409,
    );
  }

  await endLobbySessions(eventId);

  if (event.joinCode) {
    await db
      .update(quizJoinCodeHistory)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(quizJoinCodeHistory.eventId, eventId),
          eq(quizJoinCodeHistory.joinCode, event.joinCode),
          isNull(quizJoinCodeHistory.revokedAt),
        ),
      );
  }

  const [updated] = await db
    .update(quizEvent)
    .set({ status: "draft", joinCode: null })
    .where(and(eq(quizEvent.id, eventId), eq(quizEvent.adminId, admin.id)))
    .returning();

  if (!updated) {
    throw new QuizApiError("SERVER_ERROR", "Failed to unpublish event.", 500);
  }
  return serializeQuizEvent(updated);
}

// ── Questions ──────────────────────────────────────────────────────────────

export async function listQuizQuestions(eventId: string) {
  const admin = await requireAdmin();
  const event = await getOwnedEvent(admin.id, eventId);
  if (!event) {
    throw new QuizApiError("EVENT_NOT_FOUND", "Event not found.", 404);
  }

  const questions = await db.query.quizQuestion.findMany({
    where: eq(quizQuestion.eventId, eventId),
    orderBy: asc(quizQuestion.position),
    with: { answerOptions: { orderBy: asc(quizAnswerOption.position) } },
  });

  return questions.map((q) => ({
    ...serializeQuizQuestion(q),
    answer_options: q.answerOptions.map(serializeQuizAnswerOption),
  }));
}

async function insertQuestionWithOptions(
  eventId: string,
  data: CreateQuestionInput,
  position: number,
) {
  const [question] = await db
    .insert(quizQuestion)
    .values({
      eventId,
      position,
      questionType: data.question_type,
      text: data.text,
      timeLimit: data.time_limit ?? 20,
      imageUrl: data.image_url ?? null,
      ratingMin: data.rating_min ?? null,
      ratingMax: data.rating_max ?? null,
    })
    .returning();

  if (!question) {
    throw new QuizApiError("CREATE_FAILED", "Failed to create question.", 500);
  }

  const options = data.answer_options ?? [];
  let insertedOptions: (typeof quizAnswerOption.$inferSelect)[] = [];

  if (options.length > 0) {
    insertedOptions = await db
      .insert(quizAnswerOption)
      .values(
        options.map((opt, idx) => ({
          questionId: question.id,
          position: opt.position ?? idx + 1,
          text: opt.text ?? null,
          imageUrl: opt.image_url ?? null,
          isCorrect: opt.is_correct ?? false,
        })),
      )
      .returning();
  }

  return { question, answerOptions: insertedOptions };
}

export async function createQuizQuestion(
  eventId: string,
  data: CreateQuestionInput,
) {
  const admin = await requireAdmin();
  const event = await getOwnedEvent(admin.id, eventId);
  if (!event) {
    throw new QuizApiError("EVENT_NOT_FOUND", "Event not found.", 404);
  }

  const maxRow = await db.query.quizQuestion.findFirst({
    where: eq(quizQuestion.eventId, eventId),
    orderBy: desc(quizQuestion.position),
    columns: { position: true },
  });
  const nextPosition = maxRow ? maxRow.position + 1 : 1;

  try {
    const { question, answerOptions } = await insertQuestionWithOptions(
      eventId,
      data,
      nextPosition,
    );
    return {
      question: serializeQuizQuestion(question),
      answer_options: answerOptions.map(serializeQuizAnswerOption),
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new QuizApiError("CREATE_FAILED", "Failed to create question.", 500);
    }
    throw error;
  }
}

export async function getQuizQuestion(eventId: string, questionId: string) {
  const admin = await requireAdmin();
  const event = await getOwnedEvent(admin.id, eventId);
  if (!event) {
    throw new QuizApiError("EVENT_NOT_FOUND", "Event not found.", 404);
  }

  const question = await db.query.quizQuestion.findFirst({
    where: and(
      eq(quizQuestion.id, questionId),
      eq(quizQuestion.eventId, eventId),
    ),
    with: { answerOptions: { orderBy: asc(quizAnswerOption.position) } },
  });

  if (!question) {
    throw new QuizApiError("QUESTION_NOT_FOUND", "Question not found.", 404);
  }

  return {
    ...serializeQuizQuestion(question),
    answer_options: question.answerOptions.map(serializeQuizAnswerOption),
  };
}

export async function updateQuizQuestion(
  eventId: string,
  questionId: string,
  data: CreateQuestionInput,
) {
  const admin = await requireAdmin();
  const event = await getOwnedEvent(admin.id, eventId);
  if (!event) {
    throw new QuizApiError("EVENT_NOT_FOUND", "Event not found.", 404);
  }

  const existing = await db.query.quizQuestion.findFirst({
    where: and(
      eq(quizQuestion.id, questionId),
      eq(quizQuestion.eventId, eventId),
    ),
    columns: { id: true },
  });
  if (!existing) {
    throw new QuizApiError("QUESTION_NOT_FOUND", "Question not found.", 404);
  }

  const [question] = await db
    .update(quizQuestion)
    .set({
      questionType: data.question_type,
      text: data.text,
      timeLimit: data.time_limit ?? 20,
      imageUrl: data.image_url ?? null,
      ratingMin: data.rating_min ?? null,
      ratingMax: data.rating_max ?? null,
    })
    .where(eq(quizQuestion.id, questionId))
    .returning();

  if (!question) {
    throw new QuizApiError("UPDATE_FAILED", "Failed to update question.", 500);
  }

  await db
    .delete(quizAnswerOption)
    .where(eq(quizAnswerOption.questionId, questionId));

  const options = data.answer_options ?? [];
  const answerOptions =
    options.length > 0
      ? await db
          .insert(quizAnswerOption)
          .values(
            options.map((opt, idx) => ({
              questionId,
              position: opt.position ?? idx + 1,
              text: opt.text ?? null,
              imageUrl: opt.image_url ?? null,
              isCorrect: opt.is_correct ?? false,
            })),
          )
          .returning()
      : [];

  return {
    question: serializeQuizQuestion(question),
    answer_options: answerOptions.map(serializeQuizAnswerOption),
  };
}

export async function deleteQuizQuestion(eventId: string, questionId: string) {
  const admin = await requireAdmin();
  const event = await getOwnedEvent(admin.id, eventId);
  if (!event) {
    throw new QuizApiError("EVENT_NOT_FOUND", "Event not found.", 404);
  }

  const question = await db.query.quizQuestion.findFirst({
    where: and(
      eq(quizQuestion.id, questionId),
      eq(quizQuestion.eventId, eventId),
    ),
    columns: { id: true },
  });
  if (!question) {
    throw new QuizApiError("QUESTION_NOT_FOUND", "Question not found.", 404);
  }

  const live = await db.query.quizSession.findFirst({
    where: and(
      eq(quizSession.eventId, eventId),
      eq(quizSession.currentQuestionId, questionId),
      inArray(quizSession.status, [...LIVE_QUESTION_STATUSES]),
    ),
    columns: { id: true },
  });

  if (live) {
    throw new QuizApiError(
      "LIVE_QUESTION",
      "This question is currently live in a running session. End or skip it before deleting.",
      409,
    );
  }

  await db
    .update(quizSession)
    .set({ currentQuestionId: null })
    .where(
      and(
        eq(quizSession.eventId, eventId),
        eq(quizSession.currentQuestionId, questionId),
      ),
    );

  try {
    await db
      .delete(quizQuestion)
      .where(
        and(eq(quizQuestion.id, questionId), eq(quizQuestion.eventId, eventId)),
      );
  } catch (error) {
    if (
      isUniqueViolation(error) ||
      (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "23503")
    ) {
      throw new QuizApiError(
        "DELETE_BLOCKED_BY_REFERENCES",
        "Cannot delete this question because it has historical session data.",
        409,
      );
    }
    throw new QuizApiError("DELETE_FAILED", "Failed to delete question.", 500);
  }
}

// ── Sessions ───────────────────────────────────────────────────────────────

export async function createQuizSession(data: CreateSessionInput) {
  const admin = await requireAdmin();

  const event = await db.query.quizEvent.findFirst({
    where: and(eq(quizEvent.id, data.eventId), eq(quizEvent.adminId, admin.id)),
    columns: { id: true, status: true },
  });

  if (!event) {
    throw new QuizApiError("EVENT_NOT_FOUND", "Event not found.", 404);
  }

  if (event.status !== "published") {
    throw new QuizApiError(
      "EVENT_NOT_PUBLISHED",
      "Event must be published before starting a session.",
      409,
    );
  }

  const existingSession = await db.query.quizSession.findFirst({
    where: and(
      eq(quizSession.eventId, data.eventId),
      ne(quizSession.status, "ended"),
    ),
    orderBy: desc(quizSession.createdAt),
  });

  if (existingSession) {
    return { session: serializeQuizSession(existingSession), created: false };
  }

  const [session] = await db
    .insert(quizSession)
    .values({
      eventId: data.eventId,
      adminId: admin.id,
      status: "lobby",
    })
    .returning();

  if (!session) {
    throw new QuizApiError(
      "SERVER_ERROR",
      "Failed to create session. Please try again.",
      500,
    );
  }

  return { session: serializeQuizSession(session), created: true };
}

export async function findQuizSessionByJoinCode(code: string) {
  const event = await db.query.quizEvent.findFirst({
    where: and(
      ilike(quizEvent.joinCode, code.trim()),
      eq(quizEvent.status, "published"),
    ),
    columns: { id: true, title: true },
  });

  if (!event) {
    throw new QuizApiError(
      "SESSION_NOT_FOUND",
      "No active session found for this join code.",
      404,
    );
  }

  const session = await db.query.quizSession.findFirst({
    where: and(eq(quizSession.eventId, event.id), eq(quizSession.status, "lobby")),
    orderBy: desc(quizSession.createdAt),
    columns: { id: true, status: true },
  });

  if (!session) {
    throw new QuizApiError(
      "SESSION_NOT_FOUND",
      "No active session found for this join code.",
      404,
    );
  }

  return { sessionId: session.id, eventTitle: event.title };
}

function serializeSessionWithEvent(
  session: Awaited<ReturnType<typeof getQuizSessionRaw>>,
) {
  if (!session) return null;
  const base = serializeQuizSession(session);
  const event = session.event;
  if (!event) return base;

  return {
    ...base,
    events: {
      id: event.id,
      title: event.title,
      join_code: event.joinCode,
      theme_id: event.themeId,
      custom_theme: event.customTheme,
      questions: [...event.questions]
        .sort((a, b) => a.position - b.position)
        .map((q) => ({
          ...serializeQuizQuestion(q),
          answer_options: [...q.answerOptions]
            .sort((a, b) => a.position - b.position)
            .map((opt) => ({
              id: opt.id,
              position: opt.position,
              text: opt.text,
              image_url: opt.imageUrl,
            })),
        })),
    },
  };
}

async function getQuizSessionRaw(sessionId: string) {
  return db.query.quizSession.findFirst({
    where: eq(quizSession.id, sessionId),
    with: {
      event: {
        with: {
          questions: {
            with: { answerOptions: true },
          },
        },
      },
    },
  });
}

export async function getQuizSession(sessionId: string) {
  const session = await getQuizSessionRaw(sessionId);

  if (!session) {
    throw new QuizApiError("SESSION_NOT_FOUND", "Session not found.", 404);
  }

  return serializeSessionWithEvent(session)!;
}

export async function endQuizSession(sessionId: string) {
  const admin = await requireAdmin();

  const session = await db.query.quizSession.findFirst({
    where: eq(quizSession.id, sessionId),
    columns: { id: true, adminId: true },
  });

  if (!session) {
    throw new QuizApiError("SESSION_NOT_FOUND", "Session not found.", 404);
  }

  if (session.adminId !== admin.id) {
    throw new QuizApiError(
      "FORBIDDEN",
      "You are not the admin of this session.",
      403,
    );
  }

  await db
    .update(quizSession)
    .set({ status: "ended", endedAt: new Date() })
    .where(eq(quizSession.id, sessionId));

  try {
    await generateAnalyticsSnapshots(sessionId);
  } catch {
    // Don't fail end session if analytics generation fails.
  }

  await broadcastSessionEvent(sessionId, "session_state_changed", {
    status: "ended",
    currentQuestionIndex: null,
    currentQuestion: null,
    questionStartedAt: null,
  });
}

async function broadcastResultsRevealed(
  sessionId: string,
  questionId: string,
  questions: Array<{
    id: string;
    answerOptions: Array<{ id: string; isCorrect: boolean }>;
  }>,
) {
  const answers = await db.query.quizParticipantAnswer.findMany({
    where: and(
      eq(quizParticipantAnswer.sessionId, sessionId),
      eq(quizParticipantAnswer.questionId, questionId),
    ),
    columns: { selectedOptionIds: true },
  });

  const currentQuestion = questions.find((q) => q.id === questionId);
  if (!currentQuestion) return;

  const correctOptionIds = currentQuestion.answerOptions
    .filter((o) => o.isCorrect)
    .map((o) => o.id);

  const optionCounts: Record<string, number> = {};
  let totalResponses = 0;

  for (const answer of answers) {
    const selectedIds = answer.selectedOptionIds;
    if (selectedIds && selectedIds.length > 0) {
      totalResponses++;
      for (const optionId of selectedIds) {
        optionCounts[optionId] = (optionCounts[optionId] ?? 0) + 1;
      }
    }
  }

  const distribution = currentQuestion.answerOptions.map((option) => {
    const optionCount = optionCounts[option.id] ?? 0;
    const percentage =
      totalResponses > 0
        ? Math.round((optionCount / totalResponses) * 100)
        : 0;
    return { optionId: option.id, count: optionCount, percentage };
  });

  await broadcastSessionEvent(sessionId, "results_revealed", {
    questionId,
    correctOptionIds,
    distribution,
    totalResponses,
  });
}

async function broadcastLeaderboard(
  sessionId: string,
  currentQuestionId: string | null,
  isFinal: boolean,
) {
  const participants = await db.query.quizSessionParticipant.findMany({
    where: eq(quizSessionParticipant.sessionId, sessionId),
    orderBy: [
      desc(quizSessionParticipant.totalScore),
      asc(quizSessionParticipant.displayName),
    ],
  });

  if (participants.length === 0) return;

  const scoreDeltas: Record<string, number> = {};
  if (currentQuestionId) {
    const lastAnswers = await db.query.quizParticipantAnswer.findMany({
      where: and(
        eq(quizParticipantAnswer.sessionId, sessionId),
        eq(quizParticipantAnswer.questionId, currentQuestionId),
      ),
      columns: { participantId: true, scoreAwarded: true },
    });
    for (const answer of lastAnswers) {
      scoreDeltas[answer.participantId] = answer.scoreAwarded;
    }
  }

  const entries: LeaderboardEntry[] = [];
  let rank = 1;

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    const entryRank =
      i > 0 && p.totalScore === participants[i - 1].totalScore
        ? entries[i - 1].rank
        : rank;

    entries.push({
      rank: entryRank,
      participantId: p.id,
      displayName: p.displayName,
      avatar: p.avatar,
      totalScore: p.totalScore,
      scoreDelta: scoreDeltas[p.id] ?? 0,
    });

    rank = i + 2;
  }

  await Promise.all(
    entries.map((e) =>
      db
        .update(quizSessionParticipant)
        .set({ rank: e.rank })
        .where(eq(quizSessionParticipant.id, e.participantId)),
    ),
  );

  await broadcastSessionEvent(sessionId, "leaderboard_updated", {
    isFinal,
    entries,
  });
}

export async function advanceQuizSession(sessionId: string) {
  const admin = await requireAdmin();

  const session = await db.query.quizSession.findFirst({
    where: eq(quizSession.id, sessionId),
    with: {
      event: {
        with: {
          questions: {
            with: { answerOptions: true },
          },
        },
      },
    },
  });

  if (!session) {
    throw new QuizApiError("SESSION_NOT_FOUND", "Session not found.", 404);
  }

  if (session.adminId !== admin.id) {
    throw new QuizApiError(
      "FORBIDDEN",
      "You are not the admin of this session.",
      403,
    );
  }

  const questions = [...(session.event?.questions ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const totalQuestions = questions.length;
  const currentIndex = session.currentQuestionIndex ?? -1;
  const currentStatus = session.status as QuizSessionStatus;

  let nextStatus: QuizSessionStatus;
  const updates: Partial<typeof quizSession.$inferInsert> = {};

  switch (currentStatus) {
    case "lobby":
      nextStatus = "countdown";
      updates.startedAt = new Date();
      break;
    case "countdown":
      nextStatus = "question";
      break;
    case "question":
      nextStatus = "results";
      break;
    case "results":
      nextStatus = "leaderboard";
      break;
    case "leaderboard": {
      const nextIndex = currentIndex + 1;
      nextStatus = nextIndex < totalQuestions ? "countdown" : "final_leaderboard";
      break;
    }
    case "final_leaderboard":
      nextStatus = "ended";
      updates.endedAt = new Date();
      break;
    default:
      throw new QuizApiError(
        "INVALID_STATE",
        `Cannot advance from state '${currentStatus}'.`,
        409,
      );
  }

  if (nextStatus === "question") {
    const nextQuestionIndex = currentIndex + 1;
    if (nextQuestionIndex >= totalQuestions) {
      throw new QuizApiError(
        "NO_MORE_QUESTIONS",
        "No more questions available.",
        409,
      );
    }
    const nextQuestion = questions[nextQuestionIndex];
    updates.currentQuestionId = nextQuestion.id;
    updates.currentQuestionIndex = nextQuestionIndex;
    updates.questionStartedAt = new Date();
  }

  updates.status = nextStatus;

  const [updatedSession] = await db
    .update(quizSession)
    .set(updates)
    .where(eq(quizSession.id, sessionId))
    .returning();

  if (!updatedSession) {
    throw new QuizApiError(
      "SERVER_ERROR",
      "Failed to advance session state.",
      500,
    );
  }

  let currentQuestionPayload: CurrentQuestionPayload | null = null;
  const newQuestionIndex = updatedSession.currentQuestionIndex;
  if (
    nextStatus === "question" &&
    newQuestionIndex !== null &&
    newQuestionIndex !== undefined &&
    questions[newQuestionIndex]
  ) {
    const q = questions[newQuestionIndex];
    currentQuestionPayload = {
      id: q.id,
      text: q.text,
      questionType: q.questionType,
      imageUrl: q.imageUrl,
      timeLimitSeconds: q.timeLimit,
      options: [...q.answerOptions]
        .sort((a, b) => a.position - b.position)
        .map((opt) => ({
          id: opt.id,
          text: opt.text,
          imageUrl: opt.imageUrl,
          position: opt.position,
        })),
    };
  }

  await broadcastSessionEvent(sessionId, "session_state_changed", {
    status: nextStatus,
    currentQuestionIndex: updatedSession.currentQuestionIndex ?? null,
    currentQuestion: currentQuestionPayload,
    questionStartedAt: updatedSession.questionStartedAt?.toISOString() ?? null,
  });

  if (nextStatus === "results" && session.currentQuestionId) {
    await broadcastResultsRevealed(
      sessionId,
      session.currentQuestionId,
      questions,
    );
  }

  if (nextStatus === "leaderboard" || nextStatus === "final_leaderboard") {
    await broadcastLeaderboard(
      sessionId,
      session.currentQuestionId,
      nextStatus === "final_leaderboard",
    );
  }

  if (nextStatus === "ended") {
    generateAnalyticsSnapshots(sessionId).catch(() => undefined);
  }

  return { session: serializeQuizSession(updatedSession) };
}

export async function joinQuizSession(
  sessionId: string,
  data: JoinSessionInput,
) {
  if (data.participantToken?.trim()) {
    const existingParticipant = await db.query.quizSessionParticipant.findFirst({
      where: and(
        eq(quizSessionParticipant.participantToken, data.participantToken.trim()),
        eq(quizSessionParticipant.sessionId, sessionId),
      ),
    });

    if (existingParticipant) {
      const session = await db.query.quizSession.findFirst({
        where: eq(quizSession.id, sessionId),
        columns: {
          status: true,
          currentQuestionId: true,
          currentQuestionIndex: true,
          questionStartedAt: true,
        },
      });

      return {
        participantToken: existingParticipant.participantToken,
        participantId: existingParticipant.id,
        sessionId,
        displayName: existingParticipant.displayName,
        avatar: existingParticipant.avatar,
        totalScore: existingParticipant.totalScore,
        sessionStatus: session?.status ?? "lobby",
        currentQuestionId: session?.currentQuestionId ?? null,
        reconnected: true,
      };
    }
  }

  if (!data.joinCode?.trim()) {
    throw new QuizApiError(
      "VALIDATION_ERROR",
      "joinCode is required.",
      400,
      "joinCode",
    );
  }

  if (!data.displayName) {
    throw new QuizApiError(
      "VALIDATION_ERROR",
      "displayName is required.",
      400,
      "displayName",
    );
  }

  if (!data.avatar?.trim()) {
    throw new QuizApiError(
      "VALIDATION_ERROR",
      "avatar is required.",
      400,
      "avatar",
    );
  }

  const session = await db.query.quizSession.findFirst({
    where: eq(quizSession.id, sessionId),
    with: { event: { columns: { joinCode: true } } },
  });

  if (!session) {
    throw new QuizApiError("SESSION_NOT_FOUND", "Session not found.", 404);
  }

  const eventJoinCode = session.event?.joinCode;
  if (
    !eventJoinCode ||
    eventJoinCode.toUpperCase() !== data.joinCode.trim().toUpperCase()
  ) {
    throw new QuizApiError(
      "JOIN_CODE_NOT_FOUND",
      "The join code is invalid or the event is not published.",
      404,
    );
  }

  if (session.status !== "lobby") {
    throw new QuizApiError(
      "SESSION_ALREADY_STARTED",
      session.status === "ended"
        ? "This session has already ended."
        : "This session has already started. You can no longer join.",
      409,
    );
  }

  const [{ value: participantCount }] = await db
    .select({ value: count() })
    .from(quizSessionParticipant)
    .where(eq(quizSessionParticipant.sessionId, sessionId));

  if (participantCount >= 150) {
    throw new QuizApiError(
      "SESSION_AT_CAPACITY",
      "This session has reached its maximum capacity of 150 participants.",
      409,
    );
  }

  if (!validateDisplayName(data.displayName)) {
    throw new QuizApiError(
      "VALIDATION_ERROR",
      "Display name must be 1–30 characters and may only contain letters, digits, spaces, hyphens, or underscores.",
      400,
      "displayName",
    );
  }

  const nameTaken = await db.query.quizSessionParticipant.findFirst({
    where: and(
      eq(quizSessionParticipant.sessionId, sessionId),
      eq(quizSessionParticipant.displayName, data.displayName),
    ),
    columns: { id: true },
  });

  if (nameTaken) {
    throw new QuizApiError(
      "DISPLAY_NAME_TAKEN",
      "This display name is already taken in this session. Please choose a different name.",
      409,
      "displayName",
    );
  }

  const participantToken = crypto.randomUUID();

  try {
    const [participant] = await db
      .insert(quizSessionParticipant)
      .values({
        sessionId,
        displayName: data.displayName,
        avatar: data.avatar,
        participantToken,
      })
      .returning();

    if (!participant) {
      throw new QuizApiError(
        "SERVER_ERROR",
        "Failed to join session. Please try again.",
        500,
      );
    }

    return {
      participantToken,
      participantId: participant.id,
      sessionId,
      displayName: data.displayName,
      avatar: data.avatar,
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new QuizApiError(
        "DISPLAY_NAME_TAKEN",
        "This display name is already taken in this session. Please choose a different name.",
        409,
        "displayName",
      );
    }
    throw error;
  }
}

export async function submitQuizAnswer(
  sessionId: string,
  participantToken: string,
  data: SubmitAnswerInput,
) {
  const participant = await db.query.quizSessionParticipant.findFirst({
    where: and(
      eq(quizSessionParticipant.participantToken, participantToken),
      eq(quizSessionParticipant.sessionId, sessionId),
    ),
    columns: { id: true },
  });

  if (!participant) {
    throw new QuizApiError("UNAUTHORIZED", "Invalid participant token.", 401);
  }

  const session = await db.query.quizSession.findFirst({
    where: eq(quizSession.id, sessionId),
    columns: {
      status: true,
      currentQuestionId: true,
      questionStartedAt: true,
    },
  });

  if (!session) {
    throw new QuizApiError("SESSION_NOT_FOUND", "Session not found.", 404);
  }

  if (session.status !== "question") {
    throw new QuizApiError(
      "QUESTION_NOT_ACTIVE",
      "No question is currently active.",
      409,
    );
  }

  if (session.currentQuestionId !== data.questionId) {
    throw new QuizApiError(
      "QUESTION_MISMATCH",
      "The submitted questionId does not match the current active question.",
      409,
    );
  }

  if (!session.questionStartedAt) {
    throw new QuizApiError(
      "QUESTION_NOT_ACTIVE",
      "No question is currently active.",
      409,
    );
  }

  const question = await db.query.quizQuestion.findFirst({
    where: eq(quizQuestion.id, data.questionId),
    with: { answerOptions: true },
  });

  if (!question) {
    throw new QuizApiError("QUESTION_NOT_FOUND", "Question not found.", 404);
  }

  const questionStartedAt = session.questionStartedAt.getTime();
  const elapsedMs = Date.now() - questionStartedAt;
  const timeLimitMs = question.timeLimit * 1000;
  const remainingTimeMs = Math.max(0, timeLimitMs - elapsedMs);

  if (elapsedMs >= timeLimitMs) {
    throw new QuizApiError(
      "TIME_EXPIRED",
      "The time limit for this question has expired.",
      409,
    );
  }

  const openTextStr = data.openTextResponse ?? null;
  if (openTextStr !== null && openTextStr.length > 200) {
    throw new QuizApiError(
      "VALIDATION_ERROR",
      "Open-text response must be 200 characters or fewer.",
      400,
      "openTextResponse",
    );
  }

  const existingAnswer = await db.query.quizParticipantAnswer.findFirst({
    where: and(
      eq(quizParticipantAnswer.participantId, participant.id),
      eq(quizParticipantAnswer.questionId, data.questionId),
    ),
    columns: { id: true },
  });

  if (existingAnswer) {
    throw new QuizApiError(
      "ANSWER_ALREADY_SUBMITTED",
      "You have already submitted an answer for this question.",
      409,
    );
  }

  let isCorrect: boolean | null = null;
  let scoreAwarded = 0;
  const selectedIds = data.selectedOptionIds ?? [];

  if (
    question.questionType === "single_select" ||
    question.questionType === "image_choice"
  ) {
    const selectedId = selectedIds[0];
    isCorrect = selectedId
      ? (question.answerOptions.find((o) => o.id === selectedId)?.isCorrect ??
        false)
      : false;
    scoreAwarded = calculateScore(isCorrect, remainingTimeMs, timeLimitMs);
  } else if (question.questionType === "multi_select") {
    const sortedSelected = [...selectedIds].sort();
    const correctIds = question.answerOptions
      .filter((o) => o.isCorrect)
      .map((o) => o.id)
      .sort();
    isCorrect =
      sortedSelected.length === correctIds.length &&
      sortedSelected.every((id, i) => id === correctIds[i]);
    scoreAwarded = calculateScore(isCorrect, remainingTimeMs, timeLimitMs);
  }

  try {
    await db.insert(quizParticipantAnswer).values({
      sessionId,
      participantId: participant.id,
      questionId: data.questionId,
      selectedOptionIds: selectedIds.length > 0 ? selectedIds : null,
      openTextResponse: openTextStr,
      ratingValue: data.ratingValue ?? null,
      isCorrect,
      scoreAwarded,
      responseTimeMs: elapsedMs,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new QuizApiError(
        "ANSWER_ALREADY_SUBMITTED",
        "You have already submitted an answer for this question.",
        409,
      );
    }
    throw new QuizApiError("SERVER_ERROR", "Failed to submit answer.", 500);
  }

  await db
    .update(quizSessionParticipant)
    .set({
      totalScore: sql`${quizSessionParticipant.totalScore} + ${scoreAwarded}`,
    })
    .where(eq(quizSessionParticipant.id, participant.id));

  const [{ value: answeredCount }] = await db
    .select({ value: count() })
    .from(quizParticipantAnswer)
    .where(
      and(
        eq(quizParticipantAnswer.sessionId, sessionId),
        eq(quizParticipantAnswer.questionId, data.questionId),
      ),
    );

  const [{ value: totalParticipants }] = await db
    .select({ value: count() })
    .from(quizSessionParticipant)
    .where(eq(quizSessionParticipant.sessionId, sessionId));

  await broadcastSessionEvent(sessionId, "answer_count_updated", {
    questionId: data.questionId,
    answeredCount,
    totalParticipants,
  });

  if (question.questionType === "open_text" && openTextStr?.trim()) {
    const allAnswers = await db.query.quizParticipantAnswer.findMany({
      where: and(
        eq(quizParticipantAnswer.sessionId, sessionId),
        eq(quizParticipantAnswer.questionId, data.questionId),
      ),
      columns: { openTextResponse: true },
    });

    const freqMap = new Map<string, number>();
    for (const answer of allAnswers) {
      const resp = answer.openTextResponse;
      if (!resp) continue;
      const tokens = resp
        .toLowerCase()
        .split(/[^a-z0-9']+/)
        .filter((w) => w.length >= 2);
      for (const token of tokens) {
        freqMap.set(token, (freqMap.get(token) ?? 0) + 1);
      }
    }

    const wordCloudWords = Array.from(freqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word, wordCount]) => ({ word, count: wordCount }));

    await broadcastSessionEvent(sessionId, "word_cloud_updated", {
      questionId: data.questionId,
      words: wordCloudWords,
    });
  }

  return { scoreAwarded, isCorrect };
}

export async function getQuizSessionLive(sessionId: string) {
  const session = await db.query.quizSession.findFirst({
    where: eq(quizSession.id, sessionId),
    columns: {
      status: true,
      currentQuestionId: true,
      currentQuestionIndex: true,
      questionStartedAt: true,
    },
  });

  if (!session) {
    throw new QuizApiError("SESSION_NOT_FOUND", "Session not found.", 404);
  }

  const [{ value: totalParticipants }] = await db
    .select({ value: count() })
    .from(quizSessionParticipant)
    .where(eq(quizSessionParticipant.sessionId, sessionId));

  let answeredCount = 0;
  if (session.currentQuestionId) {
    const [{ value }] = await db
      .select({ value: count() })
      .from(quizParticipantAnswer)
      .where(
        and(
          eq(quizParticipantAnswer.sessionId, sessionId),
          eq(quizParticipantAnswer.questionId, session.currentQuestionId),
        ),
      );
    answeredCount = value;
  }

  return {
    status: session.status,
    currentQuestionId: session.currentQuestionId,
    currentQuestionIndex: session.currentQuestionIndex,
    questionStartedAt: session.questionStartedAt?.toISOString() ?? null,
    answeredCount,
    totalParticipants,
  };
}

// ── Analytics ──────────────────────────────────────────────────────────────

export async function getQuizAnalytics(sessionId: string) {
  const admin = await requireAdmin();

  const session = await db.query.quizSession.findFirst({
    where: eq(quizSession.id, sessionId),
    columns: { id: true, adminId: true },
  });

  if (!session) {
    throw new QuizApiError("SESSION_NOT_FOUND", "Session not found.", 404);
  }

  if (session.adminId !== admin.id) {
    throw new QuizApiError(
      "FORBIDDEN",
      "You do not have access to this session.",
      403,
    );
  }

  const snapshots = await db.query.quizAnalyticsSnapshot.findMany({
    where: eq(quizAnalyticsSnapshot.sessionId, sessionId),
    with: {
      question: {
        with: { answerOptions: { orderBy: asc(quizAnswerOption.position) } },
      },
    },
    orderBy: asc(quizAnalyticsSnapshot.questionId),
  });

  const [{ value: participantCount }] = await db
    .select({ value: count() })
    .from(quizSessionParticipant)
    .where(eq(quizSessionParticipant.sessionId, sessionId));

  return {
    sessionId,
    participantCount,
    snapshots: snapshots.map((s) =>
      serializeQuizAnalyticsSnapshot({
        ...s,
        question: s.question
          ? { ...s.question, answerOptions: s.question.answerOptions }
          : undefined,
      }),
    ),
  };
}

export async function deleteQuizAnalyticsSession(sessionId: string) {
  const admin = await requireAdmin();

  const session = await db.query.quizSession.findFirst({
    where: eq(quizSession.id, sessionId),
    columns: { id: true, adminId: true },
  });

  if (!session) {
    throw new QuizApiError("SESSION_NOT_FOUND", "Session not found.", 404);
  }

  if (session.adminId !== admin.id) {
    throw new QuizApiError(
      "FORBIDDEN",
      "You do not have access to this session.",
      403,
    );
  }

  await db.delete(quizSession).where(eq(quizSession.id, sessionId));
}

export async function exportQuizAnalyticsCsv(sessionId: string) {
  const admin = await requireAdmin();

  const session = await db.query.quizSession.findFirst({
    where: eq(quizSession.id, sessionId),
    columns: { adminId: true },
  });

  if (!session) {
    throw new QuizApiError("SESSION_NOT_FOUND", "Session not found.", 404);
  }

  if (session.adminId !== admin.id) {
    throw new QuizApiError(
      "FORBIDDEN",
      "You do not have access to this session.",
      403,
    );
  }

  return generateSessionCsv(sessionId);
}
