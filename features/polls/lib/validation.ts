import { z } from "zod";

export const createQuestionSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters").max(300),
  type: z.enum(["yes-no", "short-answer"]),
  audience: z.enum(["all", "cr-only"]),
  isAnonymous: z.boolean().default(false),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const submitResponseSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1, "Answer is required"),
  email: z.string().email(),
  studentName: z.string().optional(),
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
