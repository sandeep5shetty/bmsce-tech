import { Question, Response } from "@/types";

export type QuestionType = "yes-no" | "short-answer";
export type Audience = "all" | "cr-only";

export type QuestionWithResponses = Question & { responses: Response[] };
