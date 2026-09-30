import {
  aiGeneratedQuestionsResponseSchema,
  type GenerateQuestionsInput,
  type AiGeneratedQuestion,
} from "./validation";
import {
  acceptGeneratedQuestion,
  buildAuthorInstructionsBlock,
  normalizeGeneratedQuestion,
  OPTION_FAIRNESS_RULES,
} from "./ai-generate-shared";

function buildPrompt(input: GenerateQuestionsInput): string {
  const multiSelectRules =
    input.question_type === "multi_select"
      ? "For multi_select questions, mark ALL correct options as is_correct: true (at least 2 correct when possible)."
      : "For single_select questions, mark exactly ONE option as is_correct: true.";

  return `Generate exactly ${input.count} quiz multiple-choice questions for a live trivia game.

Topic: ${input.topic}
Difficulty: ${input.difficulty}
Question type: ${input.question_type}
Default time limit per question: ${input.time_limit} seconds
${buildAuthorInstructionsBlock(input.additional_context)}

Rules:
- Each question must have exactly 4 answer options.
- Question text must be 255 characters or fewer.
- Option text must be 120 characters or fewer.
- ${multiSelectRules}
- ${OPTION_FAIRNESS_RULES}
- Make distractors plausible for the chosen difficulty.
- Each question must be clearly distinct; no duplicate or near-duplicate wording.
- Do not repeat questions.
- Return valid JSON only, no markdown.

JSON shape:
{
  "questions": [
    {
      "text": "Question text here?",
      "question_type": "${input.question_type}",
      "time_limit": ${input.time_limit},
      "answer_options": [
        { "text": "Option A", "is_correct": false },
        { "text": "Option B", "is_correct": true },
        { "text": "Option C", "is_correct": false },
        { "text": "Option D", "is_correct": false }
      ]
    }
  ]
}`;
}

export async function generateQuestionsWithAi(
  input: GenerateQuestionsInput,
): Promise<AiGeneratedQuestion[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a quiz author for educational trivia games. Follow author instructions exactly. Avoid duplicate questions and avoid making the longest option the correct answer. Always respond with valid JSON matching the requested schema.",
        },
        {
          role: "user",
          content: buildPrompt(input),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI request failed (${response.status}): ${errorBody.slice(0, 300)}`,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }

  const validated = aiGeneratedQuestionsResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error("OpenAI response did not match the expected quiz format.");
  }

  const accepted: AiGeneratedQuestion[] = [];

  for (const raw of validated.data.questions.slice(0, input.count)) {
    const normalized = normalizeGeneratedQuestion(raw, input);
    if (!acceptGeneratedQuestion(normalized, accepted)) continue;
    accepted.push(normalized);
  }

  const questions = accepted;

  if (questions.length === 0) {
    throw new Error("No questions were generated.");
  }

  return questions;
}
