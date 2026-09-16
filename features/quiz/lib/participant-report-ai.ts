import {
  participantReportAiFeedbackSchema,
  type ParticipantReportAiFeedback,
} from "./validation";
import type { ParticipantDeterministicReport } from "./participant-report-aggregate";

const AI_TIMEOUT_MS = 25_000;

function buildAiPrompt(report: ParticipantDeterministicReport): string {
  const scoredReview = report.questionReview
    .filter((q) => q.outcome === "correct" || q.outcome === "incorrect")
    .slice(0, 24)
    .map(
      (q) =>
        `Q${q.position} (${q.questionType}): ${q.outcome}, score ${q.scoreAwarded}`,
    )
    .join("\n");

  return `You are a supportive quiz coach for a live trivia session. Write personalized feedback using ONLY the metrics below. Do not invent scores, ranks, or facts. Do not mention other participants by name.

Participant: ${report.displayName}
Event: ${report.eventTitle}
Rank: ${report.rank ?? "unranked"} of ${report.participantCount}
Total score: ${report.totalScore}
Percentile: ${report.percentile}
Scored accuracy: ${report.accuracyPercent ?? "n/a"}% (${report.correctScoredCount}/${report.answeredScoredCount} answered scored questions)
Skipped scored: ${report.skippedScoredCount}
Avg response time vs cohort: ${report.responseTimeVsCohort}
Existing strengths (deterministic): ${report.strengths.join("; ") || "none"}
Existing improvements (deterministic): ${report.improvements.join("; ") || "none"}
Type performance: ${report.typePerformance
    .map(
      (t) =>
        `${t.questionType}: ${t.accuracyPercent ?? "n/a"}% (${t.correct}/${t.answered})`,
    )
    .join("; ")}
Question outcomes sample:
${scoredReview || "No scored answers"}

Return JSON only:
{
  "summary": "2-3 sentences",
  "strengths": ["...", "..."],
  "improvement_areas": ["...", "..."],
  "prioritized_actions": ["...", "..."]
}`;
}

export async function generateParticipantReportAiFeedback(
  report: ParticipantDeterministicReport,
): Promise<ParticipantReportAiFeedback | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You write concise, encouraging quiz performance feedback for students. Respond with valid JSON matching the requested schema.",
          },
          {
            role: "user",
            content: buildAiPrompt(report),
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return null;
    }

    const validated = participantReportAiFeedbackSchema.safeParse(parsed);
    if (!validated.success) return null;

    return validated.data;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
