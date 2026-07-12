"use server";

import { and, desc, eq, sql } from "drizzle-orm";

import { buildCollaboratorInviteEmailHtml, sendEmail } from "@/lib/email";

import { getUser } from "@/actions/user";

import db from "@/db";
import { electivePollCollaborator, user } from "@/db/schema";

import { getManagedPoll, getOwnedPoll } from "./actions";
import { PollApiError, requirePollAdmin } from "./auth";
import {
  ELECTIVE_POLL_FACULTY_EMAILS,
  isElectivePollFacultyEmail,
} from "./faculty-admins";

export interface ElectivePollAdminOption {
  email: string;
  name: string | null;
  /** False for a faculty-allowlist email that has never signed into the site — still invitable, just has no account (yet) to show a name for. */
  hasAccount: boolean;
}

/**
 * Every email address that currently has (or, via the faculty allowlist,
 * automatically WOULD have) elective-poll admin access — regardless of
 * whether that person has ever signed into the site. An invite is keyed by
 * email (see electivePollCollaborator's schema comment), so the picker must
 * be able to offer allowlisted-but-never-logged-in faculty too, not just
 * existing `user` rows.
 */
export async function listElectivePollAdmins(): Promise<
  ElectivePollAdminOption[]
> {
  await requirePollAdmin();

  const allUsers = await db
    .select({
      name: user.name,
      email: user.email,
      isElectivePollAdmin: user.isElectivePollAdmin,
    })
    .from(user);

  const accountAdmins = allUsers.filter(
    (u) => u.isElectivePollAdmin || isElectivePollFacultyEmail(u.email),
  );
  const accountEmailsLower = new Set(
    accountAdmins.map((u) => u.email.toLowerCase()),
  );

  const options: ElectivePollAdminOption[] = accountAdmins.map((u) => ({
    email: u.email,
    name: u.name,
    hasAccount: true,
  }));

  for (const facultyEmail of ELECTIVE_POLL_FACULTY_EMAILS) {
    if (!accountEmailsLower.has(facultyEmail.toLowerCase())) {
      options.push({ email: facultyEmail, name: null, hasAccount: false });
    }
  }

  return options.sort((a, b) =>
    (a.name ?? a.email).localeCompare(b.name ?? b.email),
  );
}

export async function listCollaborators(pollId: string) {
  const admin = await requirePollAdmin();
  const poll = await getManagedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);

  const rows = await db.query.electivePollCollaborator.findMany({
    where: eq(electivePollCollaborator.pollId, pollId),
    orderBy: desc(electivePollCollaborator.invitedAt),
    with: {
      user: { columns: { name: true, email: true } },
      invitedByUser: { columns: { name: true, email: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    name: r.user?.name ?? null,
    email: r.user?.email ?? r.inviteEmail,
    hasAccount: !!r.user,
    status: r.status as "pending" | "accepted" | "declined",
    invitedAt: r.invitedAt.toISOString(),
    respondedAt: r.respondedAt ? r.respondedAt.toISOString() : null,
    invitedByName: r.invitedByUser?.name ?? r.invitedByUser?.email ?? null,
  }));
}

/** Powers the dashboard's "pending invites" section — matched by email, since a
 * freshly-signed-up admin's invite may not have a userId attached yet (it gets
 * lazily claimed the first time they actually open it, see findInviteForViewer). */
export async function listMyPendingInvites() {
  const admin = await requirePollAdmin();

  const rows = await db.query.electivePollCollaborator.findMany({
    where: and(
      eq(electivePollCollaborator.inviteEmail, admin.email.toLowerCase()),
      eq(electivePollCollaborator.status, "pending"),
    ),
    orderBy: desc(electivePollCollaborator.invitedAt),
    with: {
      poll: { columns: { id: true, title: true } },
      invitedByUser: { columns: { name: true, email: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    pollId: r.poll.id,
    pollTitle: r.poll.title,
    invitedByName: r.invitedByUser?.name ?? r.invitedByUser?.email ?? null,
    invitedAt: r.invitedAt.toISOString(),
  }));
}

/**
 * Invites the given email addresses to collaborate on a poll. Any accepted
 * collaborator (not just the creator) may call this. Re-validates admin
 * access server-side (never trusts the client's picker snapshot) — an email
 * is only invitable if it belongs to an existing user with
 * isElectivePollAdmin, OR is on the faculty allowlist (which works with or
 * without an account). Silently drops the poll's own creator and the
 * inviter themselves, and — critically — silently skips any target whose
 * row is already 'accepted' rather than resetting it to 'pending': without
 * the `setWhere` guard below, a stale/replayed invite (e.g. a second tab
 * with an outdated picker list) could silently downgrade an already-accepted
 * collaborator back to 'pending', revoking their access without any
 * explicit "remove" action.
 */
export async function inviteCollaborators(pollId: string, emails: string[]) {
  const admin = await requirePollAdmin();
  const poll = await getManagedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);

  const adminEmailLower = admin.email.toLowerCase();
  const creatorEmailLower = poll.creator?.email?.toLowerCase();

  const normalized = [
    ...new Set(emails.map((e) => e.toLowerCase().trim())),
  ].filter((e) => e && e !== adminEmailLower && e !== creatorEmailLower);
  if (normalized.length === 0) {
    throw new PollApiError(
      "INVALID_SELECTION",
      "No valid candidates selected.",
      400,
    );
  }

  const allUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      isElectivePollAdmin: user.isElectivePollAdmin,
    })
    .from(user);
  const userByEmail = new Map(allUsers.map((u) => [u.email.toLowerCase(), u]));

  const targets: {
    email: string;
    userId: string | null;
    name: string | null;
  }[] = [];
  for (const email of normalized) {
    const existing = userByEmail.get(email);
    if (existing) {
      if (!existing.isElectivePollAdmin && !isElectivePollFacultyEmail(email)) {
        continue;
      }
      targets.push({ email, userId: existing.id, name: existing.name });
    } else if (isElectivePollFacultyEmail(email)) {
      targets.push({ email, userId: null, name: null });
    }
  }

  if (targets.length === 0) {
    throw new PollApiError(
      "INVALID_SELECTION",
      "None of the selected emails currently have elective-poll admin access.",
      400,
    );
  }

  // RETURNING only reflects rows that were actually inserted or updated —
  // a conflicting row whose current status is 'accepted' fails `setWhere`
  // and is silently skipped (neither inserted nor updated), so it never
  // appears here and never gets an invite email either.
  const written = await db
    .insert(electivePollCollaborator)
    .values(
      targets.map((t) => ({
        pollId,
        inviteEmail: t.email,
        userId: t.userId,
        status: "pending" as const,
        invitedBy: admin.id,
      })),
    )
    .onConflictDoUpdate({
      target: [
        electivePollCollaborator.pollId,
        electivePollCollaborator.inviteEmail,
      ],
      set: {
        userId: sql`excluded.user_id`,
        status: "pending",
        invitedBy: admin.id,
        invitedAt: sql`now()`,
        respondedAt: null,
      },
      setWhere: sql`${electivePollCollaborator.status} != 'accepted'`,
    })
    .returning({
      id: electivePollCollaborator.id,
      inviteEmail: electivePollCollaborator.inviteEmail,
    });

  const acceptBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  for (const row of written) {
    const acceptUrl = `${acceptBaseUrl}/elective-polls/collaborators/accept/${row.id}`;
    try {
      await sendEmail({
        to: row.inviteEmail,
        subject: `Invitation to collaborate on "${poll.title}"`,
        text: `Hi,\n\n${admin.name ?? "A fellow admin"} has invited you to collaborate on the elective poll "${poll.title}" on bmsce.tech.\n\nView the invitation:\n${acceptUrl}`,
        html: buildCollaboratorInviteEmailHtml({
          inviterName: admin.name,
          pollTitle: poll.title,
          acceptUrl,
        }),
      });
    } catch (error) {
      // The invite row already exists regardless of email delivery — the
      // invitee can still find it via the in-app "Pending invites" section
      // once they sign in with a matching email. One recipient's delivery
      // failure must not fail the others.
      console.error(
        `Failed to send collaborator invite email to ${row.inviteEmail}:`,
        error,
      );
    }
  }

  return { invitedCount: written.length };
}

async function findInviteForViewer(
  viewer: { id: string; email: string },
  inviteId: string,
) {
  const invite = await db.query.electivePollCollaborator.findFirst({
    where: eq(electivePollCollaborator.id, inviteId),
    with: {
      poll: { columns: { id: true, title: true } },
      invitedByUser: { columns: { name: true, email: true } },
    },
  });
  if (!invite) {
    throw new PollApiError("INVITE_NOT_FOUND", "Invitation not found.", 404);
  }
  // The invite's true identity is its email, not whatever userId (if any)
  // happens to be attached yet — this is what makes it possible to invite
  // someone who didn't have an account at invite time. Ids are unguessable
  // UUIDs, but this check is still required — without it, any logged-in
  // elective-poll admin could view (or respond to) another admin's
  // invitation just by knowing/enumerating its id.
  if (invite.inviteEmail !== viewer.email.toLowerCase()) {
    throw new PollApiError(
      "NOT_YOUR_INVITE",
      "This invitation isn't addressed to your account.",
      403,
    );
  }

  // Lazily claim: the first time the actual invitee (confirmed by email)
  // opens this invite, bind it to their now-known account.
  if (invite.userId !== viewer.id) {
    const [claimed] = await db
      .update(electivePollCollaborator)
      .set({ userId: viewer.id })
      .where(eq(electivePollCollaborator.id, inviteId))
      .returning();
    return { ...invite, ...claimed };
  }

  return invite;
}

export async function getInviteForViewer(inviteId: string) {
  const viewer = await getUser();
  if (!viewer) {
    throw new PollApiError(
      "UNAUTHORIZED",
      "Please log in to view this invitation.",
      401,
    );
  }
  const invite = await findInviteForViewer(viewer, inviteId);
  return {
    id: invite.id,
    pollId: invite.poll.id,
    pollTitle: invite.poll.title,
    status: invite.status as "pending" | "accepted" | "declined",
    invitedByName:
      invite.invitedByUser?.name ?? invite.invitedByUser?.email ?? null,
  };
}

export async function respondToInvite(
  inviteId: string,
  response: "accepted" | "declined",
) {
  const viewer = await getUser();
  if (!viewer) {
    throw new PollApiError(
      "UNAUTHORIZED",
      "Please log in to respond to this invitation.",
      401,
    );
  }
  const invite = await findInviteForViewer(viewer, inviteId);
  if (invite.status !== "pending") {
    throw new PollApiError(
      "ALREADY_RESPONDED",
      "You've already responded to this invitation.",
      409,
    );
  }

  const [updated] = await db
    .update(electivePollCollaborator)
    .set({ status: response, respondedAt: new Date() })
    .where(eq(electivePollCollaborator.id, inviteId))
    .returning();
  if (!updated) {
    throw new PollApiError(
      "UPDATE_FAILED",
      "Failed to update the invitation.",
      500,
    );
  }

  return {
    status: updated.status as "accepted" | "declined",
    pollId: invite.poll.id,
    pollTitle: invite.poll.title,
  };
}

/**
 * Creator-only (unlike inviting, which any accepted collaborator can do) —
 * revoking access is more sensitive than granting it, and unlike the
 * reopen-grant feature there's no history-preservation to fall back on if
 * the wrong person got removed. Works for both cancelling a pending invite
 * and revoking already-accepted access — the row is simply deleted. Keyed
 * by the collaborator row's own id (not userId, which may still be null for
 * an unclaimed email-only invite).
 */
export async function removeCollaborator(
  pollId: string,
  collaboratorId: string,
) {
  const admin = await requirePollAdmin();
  const poll = await getOwnedPoll(admin.id, pollId);
  if (!poll) throw new PollApiError("POLL_NOT_FOUND", "Poll not found.", 404);

  const [deleted] = await db
    .delete(electivePollCollaborator)
    .where(
      and(
        eq(electivePollCollaborator.pollId, pollId),
        eq(electivePollCollaborator.id, collaboratorId),
      ),
    )
    .returning({ id: electivePollCollaborator.id });

  if (!deleted) {
    throw new PollApiError(
      "COLLABORATOR_NOT_FOUND",
      "No collaborator or invite found.",
      404,
    );
  }
}
