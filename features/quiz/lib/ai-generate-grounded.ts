import {
  aiGeneratedQuestionsResponseSchema,
  type AiGeneratedCitation,
  type AiGeneratedQuestion,
  type GenerateQuestionsInput,
} from "./validation";
import {
  acceptGeneratedQuestion,
  buildAuthorInstructionsBlock,
  buildCoveredConceptsBlock,
  normalizeGeneratedQuestion,
  OPTION_FAIRNESS_RULES,
} from "./ai-generate-shared";
import type { RetrievedMaterialChunk } from "./material-retrieval";

const GROUNDED_BATCH_SIZE = 5;
const MAX_GROUNDED_ATTEMPTS = 14;

function pickChunksForBatch(
  allChunks: RetrievedMaterialChunk[],
  collected: AiGeneratedQuestion[],
  attemptIndex: number,
): RetrievedMaterialChunk[] {
  const usedChunkIds = new Set(
    collected.flatMap((q) =>
      (q.citations ?? []).map((c) => c.chunk_id).filter(Boolean),
    ),
  );

  const unused = allChunks.filter((c) => !usedChunkIds.has(c.chunkId));
  const pool = unused.length >= 4 ? unused : allChunks;

  const start = (attemptIndex * 6) % pool.length;
  const rotated = [...pool.slice(start), ...pool.slice(0, start)];
  return rotated.slice(0, Math.min(36, rotated.length));
}

function buildGroundedPrompt(
  input: GenerateQuestionsInput,
  chunks: RetrievedMaterialChunk[],
  batchCount: number,
  existingQuestions: AiGeneratedQuestion[],
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
    existingQuestions.length > 0
      ? `\nDo NOT repeat or closely paraphrase these questions already generated (each new question must test a different concept, API, or fact):\n${existingQuestions.map((q, i) => `${i + 1}. ${q.text}`).join("\n")}\n`
      : "";

  const conceptsBlock = buildCoveredConceptsBlock(existingQuestions);

  const usedChunkIds = new Set(
    existingQuestions.flatMap((q) =>
      (q.citations ?? []).map((c) => c.chunk_id).filter(Boolean),
    ),
  );
  const usedChunksBlock =
    usedChunkIds.size > 0
      ? `\nPrefer citing source chunks you have NOT used yet. Chunks already used for prior questions should not be recycled for another question about the same concept.\n`
      : "";

  return `Generate exactly ${batchCount} quiz multiple-choice questions using ONLY the source excerpts below.

Topic focus: ${input.topic}
Difficulty: ${input.difficulty}
Question type: ${input.question_type}
Default time limit per question: ${input.time_limit} seconds
${buildAuthorInstructionsBlock(input.additional_context)}
${avoidBlock}
${conceptsBlock}
${usedChunksBlock}
Rules:
- Return exactly ${batchCount} questions in the JSON array.
- Every question and correct answer must be directly supported by at least one source excerpt.
- Each question must target a different concept (e.g. only ONE question about super(), only ONE about __init__, etc.).
- Prefer unused source chunks; spread questions across the excerpts provided.
- Each question must include at least one citation object referencing the supporting source.
- Copy chunk_id and material_id exactly from the matching [SOURCE N] block (UUID strings).
- excerpt in citations must be a short quote copied verbatim from that source (max 300 chars).
- Do not invent facts beyond the excerpts.
- Each question must have exactly 4 answer options.
- Question text must be 255 characters or fewer.
- Option text must be 120 characters or fewer.
- ${multiSelectRules}
- ${OPTION_FAIRNESS_RULES}
- Each question must test a distinct fact or angle; no duplicate or near-duplicate wording.
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

function findChunkForExcerpt(
  excerpt: string,
  materialId: string | undefined,
  chunks: RetrievedMaterialChunk[],
): RetrievedMaterialChunk | undefined {
  const normalized = excerpt.replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalized) return undefined;

  const pool = materialId
    ? chunks.filter((c) => c.materialId === materialId)
    : chunks;

  for (const len of [120, 80, 40, 20]) {
    const needle = normalized.slice(0, len);
    if (needle.length < 12) break;
    const hit = pool.find((c) =>
      c.text.toLowerCase().includes(needle),
    );
    if (hit) return hit;
  }

  return pool.length === 1 ? pool[0] : undefined;
}

function repairQuestionCitations(
  question: AiGeneratedQuestion,
  chunks: RetrievedMaterialChunk[],
): AiGeneratedQuestion {
  const citations = question.citations ?? [];
  if (citations.length === 0) return question;

  const chunkById = new Map(chunks.map((c) => [c.chunkId, c]));

  const repaired = citations.map((citation) => {
    const chunkId = citation.chunk_id;
    if (chunkId) {
      const chunk = chunkById.get(chunkId);
      if (chunk && chunk.materialId === citation.material_id) {
        return {
          ...citation,
          file_name: chunk.fileName,
        };
      }
    }

    const matched = findChunkForExcerpt(
      citation.excerpt,
      citation.material_id,
      chunks,
    );
    if (!matched) return citation;

    return {
      ...citation,
      chunk_id: matched.chunkId,
      material_id: matched.materialId,
      file_name: matched.fileName,
      page_number: citation.page_number ?? matched.pageNumber ?? undefined,
      slide_number: citation.slide_number ?? matched.slideNumber ?? undefined,
    };
  });

  return { ...question, citations: repaired };
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

async function requestGroundedBatch(
  input: GenerateQuestionsInput,
  chunks: RetrievedMaterialChunk[],
  batchCount: number,
  existingQuestions: AiGeneratedQuestion[],
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
      max_tokens: Math.min(8192, 900 + batchCount * 550),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an educational quiz author. Use only provided source excerpts. Follow author instructions exactly. Avoid duplicate questions and avoid making the longest option the correct answer. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: buildGroundedPrompt(
            input,
            chunks,
            batchCount,
            existingQuestions,
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

  const accepted: AiGeneratedQuestion[] = [];

  for (const raw of validated.data.questions.slice(0, batchCount)) {
    const normalized = normalizeGeneratedQuestion(raw, input);
    const repaired = repairQuestionCitations(normalized, chunks);
    if (!validateCitationsForChunks(repaired, chunks)) continue;
    if (!acceptGeneratedQuestion(repaired, [...existingQuestions, ...accepted])) {
      continue;
    }
    accepted.push(repaired);
  }

  return accepted;
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

  let stagnantAttempts = 0;

  for (
    let attempt = 0;
    attempt < MAX_GROUNDED_ATTEMPTS && collected.length < target;
    attempt++
  ) {
    const remaining = target - collected.length;
    const batchCount = Math.min(remaining, GROUNDED_BATCH_SIZE);
    const batchChunks = pickChunksForBatch(chunks, collected, attempt);

    const batch = await requestGroundedBatch(
      input,
      batchChunks,
      batchCount,
      collected,
    );

    let added = 0;
    for (const question of batch) {
      if (!acceptGeneratedQuestion(question, collected)) continue;
      collected.push({
        ...question,
        citations: (question.citations ?? []).map((c: AiGeneratedCitation) => ({
          ...c,
          excerpt: c.excerpt.trim().slice(0, 500),
        })),
      });
      added++;
      if (collected.length >= target) break;
    }

    if (added === 0) {
      stagnantAttempts++;
      if (stagnantAttempts >= 2) break;
    } else {
      stagnantAttempts = 0;
    }
  }

  if (collected.length === 0) {
    throw new Error(
      "No valid grounded questions were produced. Try a broader topic or add more source material.",
    );
  }

  return collected.slice(0, target);
}
