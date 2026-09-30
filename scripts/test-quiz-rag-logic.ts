/**
 * Run: npx tsx scripts/test-quiz-rag-logic.ts
 */
import { buildChunksFromSegments } from "../features/quiz/lib/material-chunk";
import { cosineSimilarity } from "../features/quiz/lib/material-embeddings";
import { isNearDuplicateQuestion } from "../features/quiz/lib/ai-generate-shared";
import type { AiGeneratedQuestion } from "../features/quiz/lib/validation";

const chunks = buildChunksFromSegments([
  { text: "A ".repeat(500), pageNumber: 1 },
  { text: "Second segment about binary trees.", pageNumber: 2 },
]);

if (chunks.length < 2) {
  throw new Error("Expected long segment to split into multiple chunks");
}

const sim = cosineSimilarity([1, 0, 0], [1, 0, 0]);
if (sim < 0.99) {
  throw new Error("cosineSimilarity identity check failed");
}

const orth = cosineSimilarity([1, 0], [0, 1]);
if (Math.abs(orth) > 0.01) {
  throw new Error("cosineSimilarity orthogonal check failed");
}

function stubQuestion(text: string): AiGeneratedQuestion {
  return {
    text,
    question_type: "single_select",
    answer_options: [
      { text: "A", is_correct: true },
      { text: "B", is_correct: false },
      { text: "C", is_correct: false },
      { text: "D", is_correct: false },
    ],
  };
}

const superA = stubQuestion(
  "What is the purpose of the super() method in Python?",
);
const superB = stubQuestion(
  "What is the purpose of using the super() method in a subclass?",
);
const superC = stubQuestion(
  "What is the main purpose of the super() function in Python?",
);

if (!isNearDuplicateQuestion(superB, [superA])) {
  throw new Error("Expected super() paraphrases to be near-duplicates");
}
if (!isNearDuplicateQuestion(superC, [superA])) {
  throw new Error("Expected super() function variant to be a near-duplicate");
}

const other = stubQuestion("What is method overriding in Python?");
if (isNearDuplicateQuestion(other, [superA])) {
  throw new Error("Different OOP topic should not be flagged as duplicate");
}

console.log("quiz RAG logic checks passed");
