export type QuestionType = "yes-no" | "short-answer";
export type Audience = "all" | "cr-only";

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  createdAt: Date;
}

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  audience: Audience;
  isAnonymous: boolean;
  requireName: boolean;
  createdAt: Date;
  responses?: Response[];
}

export interface Response {
  id: string;
  questionId: string;
  answer: string;
  studentId?: string;
  student?: Student;
  name?: string;
  submittedAt: Date;
}
