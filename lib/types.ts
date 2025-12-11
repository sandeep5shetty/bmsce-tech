export type QuestionType = "yes-no" | "short-answer";
export type Audience = "all" | "cr-only";

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  audience: Audience;
  isAnonymous: boolean;   // you may remove this later since no anonymous allowed
  requireName: boolean;   // unused now
  createdAt: Date;
  responses?: Response[];
}

export interface Response {
  id: string;
  questionId: string;
  answer: string;
  email: string;          // ✅ ALWAYS present (no anonymous)
  submittedAt: Date;
}
