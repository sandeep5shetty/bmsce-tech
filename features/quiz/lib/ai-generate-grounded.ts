import {
  aiGeneratedQuestionsResponseSchema,
  type AiGeneratedCitation,
  type AiGeneratedQuestion,
  type GenerateQuestionsInput,
} from "./validation";
import { normalizeGeneratedQuestion } from "./ai-generate-shared";
import type { RetrievedMaterialChunk } from "./material-retrieval";

function buildGroundedPrompt(
  input: GenerateQuestionsInput,
  chunks: RetrievedMaterialChunk[],
  batchCount: number,
  existingQuestionTexts: string[],
): string {
  const multiSelectRules =
    input.question_type === "multi_select"
      ? "For multi_select questions, mark ALL correct options as is_correct: true (at least 2 correct when possible)."
      : "For single_select questions, mark exactly ONE option as is_correct: true.";

  const sourceBlock = chunks
    .map((chunk, index) => {
      const location =
        chunk.pageNumber != null
          ? `page ${chunk.pageNumber}`
          : chunk.slideNumber != null
            ? `slide ${chunk.slideNumber}`
            : "location unknown";
      return `[SOURCE ${index + 1}]
chunk_id: ${chunk.chunkId}
material_id: ${chunk.materialId}
file_name: ${chunk.fileName}
location: ${location}
excerpt: ${chunk.text}`;
    })
    .join("\n\n");

  const avoidBlock =
    existingQuestionTexts.length > 0
      ? `\nDo NOT repeat or closely paraphrase these questions already generated:\n${existingQuestionTexts.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n`
      : "";

  return `Generate exactly ${batchCount} quiz multiple-choice questions using ONLY the source excerpts below.

Topic focus: ${input.topic}
Difficulty: ${input.difficulty}
Question type: ${input.question_type}
Default time limit per question: ${input.time_limit} seconds
${input.additional_context ? `Additional context: ${input.additional_context}` : ""}
${avoidBlock}
Rules:
- Return exactly ${batchCount} questions in the JSON array when the sources support it.
- Every question and correct answer must be directly supported by at least one source excerpt.
- Each question must include at least one citation object referencing the supporting source.
- Use chunk_id and material_id from the matching source block.
- excerpt in citations must be a short quote copied from that source (max 300 chars).
- Do not invent facts beyond the excerpts.
- Each question must have exactly 4 answer options.
- Question text must be 255 characters or fewer.
- Option text must be 120 characters or fewer.
- ${multiSelectRules}
- Do not repeat questions.
- Return valid JSON only, no markdown.

SOURCE EXCERPTS:
${sourceBlock}

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
      ],
      "citations": [
        {
          "material_id": "uuid",
          "chunk_id": "uuid",
          "file_name": "file.pdf",
          "page_number": 1,
          "excerpt": "short quote from source"
        }
      ]
    }
  ]
}`;
}

function validateCitationsForChunks(
  question: AiGeneratedQuestion,
  chunks: RetrievedMaterialChunk[],
): boolean {
  const citations = question.citations ?? [];
  if (citations.length === 0) return false;

  const chunkById = new Map(chunks.map((c) => [c.chunkId, c]));
  const materialIds = new Set(chunks.map((c) => c.materialId));

  return citations.every((citation) => {
    if (!materialIds.has(citation.material_id)) return false;
    if (citation.chunk_id) {
      const chunk = chunkById.get(citation.chunk_id);
      if (!chunk || chunk.materialId !== citation.material_id) return false;
    }
    return citation.excerpt.trim().length > 0;
  });
}

function dedupeKey(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

async function requestGroundedBatch(
  input: GenerateQuestionsInput,
  chunks: RetrievedMaterialChunk[],
  batchCount: number,
  existingQuestionTexts: string[],
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
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an educational quiz author. Use only provided source excerpts. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: buildGroundedPrompt(
            input,
            chunks,
            batchCount,
            existingQuestionTexts,
          ),
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

  return validated.data.questions
    .slice(0, batchCount)
    .map((q) => normalizeGeneratedQuestion(q, input))
    .filter((q) => validateCitationsForChunks(q, chunks));
}

export async function generateGroundedQuestionsWithAi(
  input: GenerateQuestionsInput,
  chunks: RetrievedMaterialChunk[],
): Promise<AiGeneratedQuestion[]> {
  if (chunks.length === 0) {
    throw new Error(
      "No indexed course materials found. Upload and index materials first.",
    );
  }

  const target = input.count;
  const collected: AiGeneratedQuestion[] = [];
  const seen = new Set<string>();

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts && collected.length < target; attempt++) {
    const remaining = target - collected.length;
    const batchCount = Math.min(remaining, attempt === 0 ? remaining : remaining + 2);

    const batch = await requestGroundedBatch(
      input,
      chunks,
      batchCount,
      collected.map((q) => q.text),
    );

    for (const question of batch) {
      const key = dedupeKey(question.text);
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push({
        ...question,
        citations: (question.citations ?? []).map((c: AiGeneratedCitation) => ({
          ...c,
          excerpt: c.excerpt.trim().slice(0, 500),
        })),
      });
      if (collected.length >= target) break;
    }

    if (batch.length === 0) break;
  }

  if (collected.length === 0) {
    throw new Error(
      "No valid grounded questions were produced. Try a broader topic or add more source material.",
    );
  }

  return collected.slice(0, target);
}
