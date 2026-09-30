/**
 * Run: npx tsx scripts/test-quiz-rag-logic.ts
 */
import { buildChunksFromSegments } from "../features/quiz/lib/material-chunk";
import { cosineSimilarity } from "../features/quiz/lib/material-embeddings";

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

console.log("quiz RAG logic checks passed");
