import { getUser } from "@/actions/user";

import type { User } from "@/types";

export class QuizApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public field?: string,
  ) {
    super(message);
    this.name = "QuizApiError";
  }
}

export async function requireAdmin(): Promise<User> {
  const user = await getUser();
  if (!user) {
    throw new QuizApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return user;
}

export function isQuizApiError(error: unknown): error is QuizApiError {
  return error instanceof QuizApiError;
}

export function quizErrorBody(error: QuizApiError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.field ? { field: error.field } : {}),
    },
  };
}
