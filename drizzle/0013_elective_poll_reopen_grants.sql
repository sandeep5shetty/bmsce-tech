-- Lets an admin selectively grant specific non-responders access to submit
-- to a *closed* poll (e.g. a handful of stragglers), without reopening it
-- for the whole original audience. Revoking sets revoked_at/revoked_by
-- instead of deleting the row, and a revoke-then-regrant always inserts a
-- fresh row, so the accountability trail (who was granted access, when, why,
-- by whom) is never lost.
CREATE TABLE "elective_poll_reopen_grant" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"student_id" text NOT NULL,
	"remarks" text NOT NULL,
	"granted_by" text,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"revoked_by" text
);
--> statement-breakpoint
ALTER TABLE "elective_poll_reopen_grant" ADD CONSTRAINT "elective_poll_reopen_grant_poll_id_elective_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."elective_poll"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_poll_reopen_grant" ADD CONSTRAINT "elective_poll_reopen_grant_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_poll_reopen_grant" ADD CONSTRAINT "elective_poll_reopen_grant_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_poll_reopen_grant" ADD CONSTRAINT "elective_poll_reopen_grant_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- Only one *active* (non-revoked) grant per student per poll at a time.
CREATE UNIQUE INDEX "elective_poll_reopen_grant_poll_student_active_unique" ON "elective_poll_reopen_grant" ("poll_id","student_id") WHERE "revoked_at" IS NULL;
--> statement-breakpoint
CREATE INDEX "elective_poll_reopen_grant_poll_id_idx" ON "elective_poll_reopen_grant" ("poll_id");
--> statement-breakpoint
ALTER TABLE "elective_poll_reopen_grant" ADD CONSTRAINT "elective_poll_reopen_grant_remarks_length_check" CHECK (char_length(trim(both from "remarks")) BETWEEN 1 AND 2000);
