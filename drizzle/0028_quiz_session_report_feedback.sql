CREATE TABLE IF NOT EXISTS "quiz_session_report_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"display_name" text NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"rating" integer NOT NULL,
	"feedback_text" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_session_report_feedback_participant" UNIQUE("session_id","participant_id")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quiz_session_report_feedback" ADD CONSTRAINT "quiz_session_report_feedback_session_id_quiz_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quiz_session_report_feedback" ADD CONSTRAINT "quiz_session_report_feedback_participant_id_quiz_session_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."quiz_session_participant"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
