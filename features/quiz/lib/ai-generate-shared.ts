import type { AiGeneratedQuestion, GenerateQuestionsInput } from "./validation";

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "what",
  "which",
  "how",
  "why",
  "who",
  "when",
  "where",
  "of",
  "in",
  "to",
  "and",
  "or",
  "for",
  "on",
  "with",
  "does",
  "do",
  "did",
  "this",
  "that",
  "these",
  "those",
  "from",
  "as",
  "at",
  "by",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "using",
  "use",
  "main",
]);

const DEFINITION_QUESTION_PATTERN =
  /\b(what is|what are|purpose|role|used for|main function|define|meaning of|why use|why do)\b/i;

export function buildAuthorInstructionsBlock(
  additionalContext?: string,
): string {
  if (!additionalContext?.trim()) return "";
  return `\nAuthor instructions (you must follow these):\n${additionalContext.trim()}\n`;
}

export const OPTION_FAIRNESS_RULES = `- Keep all four options similar in length (roughly the same word count). The correct answer must NOT be the longest or most detailed option.
- Do not use length, verbosity, or extra qualifiers as a giveaway for the correct answer.
- Vary which option position is marked correct across questions; avoid always placing the correct answer in the same slot.`;

export function dedupeKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantTokens(text: string): Set<string> {
  return new Set(
    dedupeKey(text)
      .split(" ")
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

function trigramSimilarity(a: string, b: string): number {
  const wordsA = dedupeKey(a).split(" ").filter(Boolean);
  const wordsB = dedupeKey(b).split(" ").filter(Boolean);
  if (wordsA.length < 3 || wordsB.length < 3) return 0;

  const trigramsA = new Set<string>();
  for (let i = 0; i <= wordsA.length - 3; i++) {
    trigramsA.add(wordsA.slice(i, i + 3).join(" "));
  }
  let hit = 0;
  for (let i = 0; i <= wordsB.length - 3; i++) {
    if (trigramsA.has(wordsB.slice(i, i + 3).join(" "))) hit++;
  }
  const total = Math.max(trigramsA.size, wordsB.length - 2);
  return total === 0 ? 0 : hit / total;
}

export function questionSimilarity(a: string, b: string): number {
  const sa = significantTokens(a);
  const sb = significantTokens(b);
  if (sa.size === 0 && sb.size === 0) {
    return dedupeKey(a) === dedupeKey(b) ? 1 : 0;
  }
  let intersection = 0;
  for (const token of sa) {
    if (sb.has(token)) intersection++;
  }
  const union = sa.size + sb.size - intersection;
  const jaccard = union === 0 ? 0 : intersection / union;
  const trigram = trigramSimilarity(a, b);
  return Math.max(jaccard, trigram);
}

export function extractTechnicalAnchors(text: string): string[] {
  const lower = text.toLowerCase();
  const anchors = new Set<string>();

  for (const match of lower.matchAll(/\b([a-z_][\w]*)\s*\(\s*\)/g)) {
    const name = match[1];
    if (name && name.length > 1) anchors.add(`${name}()`);
  }

  if (/\bsuper\b/.test(lower)) anchors.add("super()");
  if (/\b__init__\b/.test(lower)) anchors.add("__init__()");

  for (const kw of [
    "inheritance",
    "polymorphism",
    "encapsulation",
    "abstraction",
    "subclass",
    "superclass",
    "method overriding",
  ]) {
    if (lower.includes(kw)) anchors.add(kw);
  }

  return [...anchors];
}

function sharesCitationChunk(
  a: AiGeneratedQuestion,
  b: AiGeneratedQuestion,
): boolean {
  const idsA = new Set(
    (a.citations ?? []).map((c) => c.chunk_id).filter(Boolean),
  );
  for (const c of b.citations ?? []) {
    if (c.chunk_id && idsA.has(c.chunk_id)) return true;
  }
  return false;
}

function isSameConceptDuplicate(
  candidate: AiGeneratedQuestion,
  existing: AiGeneratedQuestion,
): boolean {
  const textA = candidate.text;
  const textB = existing.text;

  if (dedupeKey(textA) === dedupeKey(textB)) return true;

  const sim = questionSimilarity(textA, textB);
  if (sim >= 0.5) return true;

  const anchorsA = extractTechnicalAnchors(textA);
  const anchorsB = extractTechnicalAnchors(textB);
  const sharedAnchors = anchorsA.filter((a) => anchorsB.includes(a));

  if (sharedAnchors.length === 0) return false;

  const defA = DEFINITION_QUESTION_PATTERN.test(textA);
  const defB = DEFINITION_QUESTION_PATTERN.test(textB);
  if (defA && defB && sharedAnchors.length >= 1) return true;

  if (sim >= 0.38 && sharedAnchors.length >= 1) return true;

  if (sharesCitationChunk(candidate, existing) && sim >= 0.32) {
    return true;
  }

  return false;
}

export function isNearDuplicateQuestion(
  candidate: AiGeneratedQuestion,
  existingQuestions: AiGeneratedQuestion[],
): boolean {
  for (const existing of existingQuestions) {
    if (isSameConceptDuplicate(candidate, existing)) return true;
  }
  return false;
}

export function buildCoveredConceptsBlock(
  existingQuestions: AiGeneratedQuestion[],
): string {
  const concepts = new Set<string>();
  for (const q of existingQuestions) {
    for (const anchor of extractTechnicalAnchors(q.text)) {
      concepts.add(anchor);
    }
  }
  if (concepts.size === 0) return "";
  return `\nConcepts already quizzed (do NOT ask another purpose/definition question about these — use a different topic from the sources):\n${[...concepts].join(", ")}\n`;
}

export function hasObviousLongestCorrectAnswer(
  question: AiGeneratedQuestion,
): boolean {
  if (question.question_type !== "single_select") return false;

  const options = question.answer_options;
  const correctIdx = options.findIndex((o) => o.is_correct);
  if (correctIdx < 0) return false;

  const lengths = options.map((o) => o.text.trim().length);
  const correctLen = lengths[correctIdx];
  const otherLengths = lengths.filter((_, i) => i !== correctIdx);
  const avgOther =
    otherLengths.reduce((sum, n) => sum + n, 0) / otherLengths.length;
  const maxLen = Math.max(...lengths);

  if (correctLen !== maxLen) return false;
  if (avgOther < 8) return false;

  return correctLen >= avgOther * 1.35;
}

function shuffleOptions<T>(options: T[]): T[] {
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function normalizeGeneratedQuestion(
  question: AiGeneratedQuestion,
  input: GenerateQuestionsInput,
): AiGeneratedQuestion {
  let options = question.answer_options.map((opt) => ({
    text: opt.text.trim(),
    is_correct: opt.is_correct,
  }));

  if (input.question_type === "single_select") {
    const correctIndexes = options
      .map((opt, idx) => (opt.is_correct ? idx : -1))
      .filter((idx) => idx >= 0);
    const keepCorrect =
      correctIndexes.length > 0 ? correctIndexes[0] : 0;
    options.forEach((opt, idx) => {
      opt.is_correct = idx === keepCorrect;
    });
  } else {
    if (!options.some((opt) => opt.is_correct)) {
      options[0].is_correct = true;
      options[1].is_correct = true;
    }
  }

  options = shuffleOptions(options);

  return {
    text: question.text.trim(),
    question_type: input.question_type,
    time_limit: question.time_limit,
    answer_options: options,
    citations: question.citations,
  };
}

export function acceptGeneratedQuestion(
  question: AiGeneratedQuestion,
  existingQuestions: AiGeneratedQuestion[],
): boolean {
  if (isNearDuplicateQuestion(question, existingQuestions)) return false;
  if (hasObviousLongestCorrectAnswer(question)) return false;
  return true;
}
