import type {
  quizAnalyticsSnapshot,
  quizAnswerOption,
  quizEvent,
  quizParticipantAnswer,
  quizQuestion,
  quizSession,
  quizSessionParticipant,
} from "@/db/schema";

export type QuizEventStatus = "draft" | "published";

export type QuizSessionStatus =
  | "lobby"
  | "countdown"
  | "question"
  | "results"
  | "leaderboard"
  | "final_leaderboard"
  | "ended";

export type QuizQuestionType =
  | "single_select"
  | "multi_select"
  | "open_text"
  | "rating_scale"
  | "image_choice";

export type QuizEventRow = typeof quizEvent.$inferSelect;
export type QuizQuestionRow = typeof quizQuestion.$inferSelect;
export type QuizAnswerOptionRow = typeof quizAnswerOption.$inferSelect;
export type QuizSessionRow = typeof quizSession.$inferSelect;
export type QuizSessionParticipantRow = typeof quizSessionParticipant.$inferSelect;
export type QuizParticipantAnswerRow = typeof quizParticipantAnswer.$inferSelect;
export type QuizAnalyticsSnapshotRow = typeof quizAnalyticsSnapshot.$inferSelect;

export interface QuizApiErrorBody {
  code: string;
  message: string;
  field?: string;
}

export interface OptionCountEntry {
  optionId: string;
  count: number;
  percentage: number;
}

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  displayName: string;
  avatar: string;
  totalScore: number;
  scoreDelta: number;
}

export interface CurrentQuestionPayload {
  id: string;
  position: number;
  text: string;
  questionType: string;
  imageUrl: string | null;
  timeLimitSeconds: number;
  options: Array<{
    id: string;
    text: string | null;
    imageUrl: string | null;
    position: number;
  }>;
}

export function serializeQuizEvent(row: QuizEventRow) {
  return {
    id: row.id,
    admin_id: row.adminId,
    title: row.title,
    description: row.description,
    status: row.status,
    join_code: row.joinCode,
    logo_url: row.logoUrl,
    theme_id: row.themeId,
    custom_theme: row.customTheme,
    anonymous_mode: row.anonymousMode,
    auto_play_mode: row.autoPlayMode,
    enforce_focus_mode: row.enforceFocusMode,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function serializeQuizQuestion(row: QuizQuestionRow) {
  return {
    id: row.id,
    event_id: row.eventId,
    position: row.position,
    question_type: row.questionType,
    text: row.text,
    image_url: row.imageUrl,
    time_limit: row.timeLimit,
    rating_min: row.ratingMin,
    rating_max: row.ratingMax,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function serializeQuizAnswerOption(row: QuizAnswerOptionRow) {
  return {
    id: row.id,
    question_id: row.questionId,
    position: row.position,
    text: row.text,
    image_url: row.imageUrl,
    is_correct: row.isCorrect,
    created_at: row.createdAt.toISOString(),
  };
}

export function serializeQuizSession(row: QuizSessionRow) {
  return {
    id: row.id,
    event_id: row.eventId,
    admin_id: row.adminId,
    status: row.status,
    current_question_id: row.currentQuestionId,
    current_question_index: row.currentQuestionIndex,
    question_started_at: row.questionStartedAt?.toISOString() ?? null,
    participant_count: row.participantCount,
    started_at: row.startedAt?.toISOString() ?? null,
    ended_at: row.endedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
  };
}

export function serializeQuizSessionParticipant(row: QuizSessionParticipantRow) {
  return {
    id: row.id,
    session_id: row.sessionId,
    display_name: row.displayName,
    avatar: row.avatar,
    total_score: row.totalScore,
    rank: row.rank,
    is_connected: row.isConnected,
    disconnected_at: row.disconnectedAt?.toISOString() ?? null,
    participant_token: row.participantToken,
    created_at: row.createdAt.toISOString(),
  };
}

export function serializeQuizAnalyticsSnapshot(
  row: QuizAnalyticsSnapshotRow & {
    question?: QuizQuestionRow & { answerOptions?: QuizAnswerOptionRow[] };
  },
) {
  return {
    id: row.id,
    session_id: row.sessionId,
    question_id: row.questionId,
    total_responses: row.totalResponses,
    option_counts: row.optionCounts,
    avg_response_time_ms: row.avgResponseTimeMs,
    created_at: row.createdAt.toISOString(),
    questions: row.question
      ? {
          ...serializeQuizQuestion(row.question),
          answer_options: (row.question.answerOptions ?? []).map(
            serializeQuizAnswerOption,
          ),
        }
      : undefined,
  };
}
