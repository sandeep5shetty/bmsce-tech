import { getUser } from "@/actions/user";

import type { User } from "@/types";

import { isQuizAdminEmail } from "./admins";

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
  if (!isQuizAdminEmail(user.email)) {
    throw new QuizApiError(
      "FORBIDDEN",
      "Only activity coordinators can manage quizzes.",
      403,
    );
  }
  return user;
}

export function canManageQuiz(email: string | null | undefined): boolean {
  return isQuizAdminEmail(email);
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
