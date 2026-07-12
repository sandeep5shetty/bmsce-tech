-- Lets an admin invite a collaborator by email even if they don't have an
-- account yet (e.g. a faculty member on the allowlist who's never signed
-- into the site). The invite's true identity becomes the email, not the
-- user id — user_id is populated once an account is resolved, either at
-- invite time (if one already exists) or lazily the first time the
-- matching-email visitor opens their invite.
ALTER TABLE "elective_poll_collaborator" ADD COLUMN "invite_email" text;
--> statement-breakpoint
UPDATE "elective_poll_collaborator" c SET "invite_email" = (SELECT lower(u.email) FROM "user" u WHERE u.id = c.user_id);
--> statement-breakpoint
ALTER TABLE "elective_poll_collaborator" ALTER COLUMN "invite_email" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "elective_poll_collaborator" ALTER COLUMN "user_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "elective_poll_collaborator" DROP CONSTRAINT "elective_poll_collaborator_poll_user_unique";
--> statement-breakpoint
ALTER TABLE "elective_poll_collaborator" ADD CONSTRAINT "elective_poll_collaborator_poll_invite_email_unique" UNIQUE("poll_id","invite_email");
