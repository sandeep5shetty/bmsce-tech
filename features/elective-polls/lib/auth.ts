import { getUser } from "@/actions/user";

import type { User } from "@/types";

import { isElectivePollFacultyEmail } from "./faculty-admins";

export class PollApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public field?: string,
  ) {
    super(message);
    this.name = "PollApiError";
  }
}

function hasElectivePollAccess(
  user: Pick<User, "isElectivePollAdmin" | "email"> | null | undefined,
): boolean {
  if (!user) return false;
  return user.isElectivePollAdmin || isElectivePollFacultyEmail(user.email);
}

export async function requirePollAdmin(): Promise<User> {
  const user = await getUser();
  if (!user) {
    throw new PollApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  if (!hasElectivePollAccess(user)) {
    throw new PollApiError(
      "FORBIDDEN",
      "Only elective-poll admins can manage polls.",
      403,
    );
  }
  return user;
}

export function canManageElectivePolls(
  user: Pick<User, "isElectivePollAdmin" | "email"> | null | undefined,
): boolean {
  return hasElectivePollAccess(user);
}

export function isPollApiError(error: unknown): error is PollApiError {
  return error instanceof PollApiError;
}

export function pollErrorBody(error: PollApiError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.field ? { field: error.field } : {}),
    },
  };
}
