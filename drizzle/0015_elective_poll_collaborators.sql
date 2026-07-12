-- Lets a poll's creator (or, once accepted, any collaborator) invite other
-- elective-poll admins to manage this specific poll. Invites are
-- request+accept: a row starts 'pending' and only grants access once the
-- invitee flips it to 'accepted' themselves.
CREATE TABLE "elective_poll_collaborator" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by" text,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	CONSTRAINT "elective_poll_collaborator_poll_user_unique" UNIQUE("poll_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "elective_poll_collaborator" ADD CONSTRAINT "elective_poll_collaborator_poll_id_elective_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."elective_poll"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_poll_collaborator" ADD CONSTRAINT "elective_poll_collaborator_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_poll_collaborator" ADD CONSTRAINT "elective_poll_collaborator_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "elective_poll_collaborator_poll_id_idx" ON "elective_poll_collaborator" ("poll_id");
--> statement-breakpoint
CREATE INDEX "elective_poll_collaborator_user_id_idx" ON "elective_poll_collaborator" ("user_id");
--> statement-breakpoint
ALTER TABLE "elective_poll_collaborator" ADD CONSTRAINT "elective_poll_collaborator_status_check" CHECK ("status" IN ('pending', 'accepted', 'declined'));
