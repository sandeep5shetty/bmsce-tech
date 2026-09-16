import {
  claimParticipantReportGeneration,
  getCachedReportAiState,
  markParticipantReportAiUnavailable,
  saveParticipantReportAiFailure,
  saveParticipantReportAiSuccess,
} from "./participant-report-cache";
import { generateParticipantReportAiFeedback } from "./participant-report-ai";
import { buildParticipantReportPdfStatus } from "./participant-report-pdf-api";
import {
  loadDeterministicParticipantReport,
  type ParticipantDeterministicReport,
} from "./participant-report";

export function serializeDeterministicReport(report: ParticipantDeterministicReport) {
  return {
    session_id: report.sessionId,
    participant_id: report.participantId,
    display_name: report.displayName,
    avatar: report.avatar,
    event_title: report.eventTitle,
    total_score: report.totalScore,
    rank: report.rank,
    participant_count: report.participantCount,
    percentile: report.percentile,
    scored_question_count: report.scoredQuestionCount,
    answered_scored_count: report.answeredScoredCount,
    correct_scored_count: report.correctScoredCount,
    accuracy_percent: report.accuracyPercent,
    skipped_scored_count: report.skippedScoredCount,
    unscored_question_count: report.unscoredQuestionCount,
    answered_unscored_count: report.answeredUnscoredCount,
    avg_response_time_ms: report.avgResponseTimeMs,
    cohort_avg_response_time_ms: report.cohortAvgResponseTimeMs,
    response_time_vs_cohort: report.responseTimeVsCohort,
    type_performance: report.typePerformance.map((t) => ({
      question_type: t.questionType,
      answered: t.answered,
      correct: t.correct,
      accuracy_percent: t.accuracyPercent,
    })),
    strengths: report.strengths,
    improvements: report.improvements,
    question_review: report.questionReview.map((q) => ({
      question_id: q.questionId,
      position: q.position,
      text: q.text,
      question_type: q.questionType,
      outcome: q.outcome,
      score_awarded: q.scoreAwarded,
      response_time_ms: q.responseTimeMs,
      cohort_avg_response_time_ms: q.cohortAvgResponseTimeMs,
      your_answer_label: q.yourAnswerLabel,
      correct_answer_label: q.correctAnswerLabel,
    })),
  };
}

export async function buildParticipantReportPayload(
  sessionId: string,
  participantId: string,
) {
  const report = await loadDeterministicParticipantReport(
    sessionId,
    participantId,
  );
  const ai = await getCachedReportAiState(participantId);
  const pdf = await buildParticipantReportPdfStatus(sessionId, participantId);

  return {
    report: serializeDeterministicReport(report),
    ai: {
      status: ai.status,
      feedback: ai.feedback
        ? {
            summary: ai.feedback.summary,
            strengths: ai.feedback.strengths,
            improvement_areas: ai.feedback.improvement_areas,
            prioritized_actions: ai.feedback.prioritized_actions,
          }
        : null,
      error: ai.error,
    },
    pdf,
  };
}

export async function generateParticipantReportAi(
  sessionId: string,
  participantId: string,
) {
  const report = await loadDeterministicParticipantReport(
    sessionId,
    participantId,
  );

  if (!process.env.OPENAI_API_KEY) {
    await markParticipantReportAiUnavailable(sessionId, participantId);
    return buildParticipantReportPayload(sessionId, participantId);
  }

  const claim = await claimParticipantReportGeneration(sessionId, participantId);

  if (claim.action === "ready" || claim.action === "unavailable") {
    return buildParticipantReportPayload(sessionId, participantId);
  }

  if (claim.action === "wait") {
    const payload = await buildParticipantReportPayload(sessionId, participantId);
    return { ...payload, generating: true as const };
  }

  const feedback = await generateParticipantReportAiFeedback(report);

  if (feedback) {
    await saveParticipantReportAiSuccess(participantId, feedback);
  } else {
    await saveParticipantReportAiFailure(
      participantId,
      "Could not generate AI feedback. Your stats below are still complete.",
    );
  }

  return buildParticipantReportPayload(sessionId, participantId);
}
