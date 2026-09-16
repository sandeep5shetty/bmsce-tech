CREATE TABLE "quiz_participant_report" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"ai_status" text DEFAULT 'idle' NOT NULL,
	"ai_feedback" jsonb,
	"ai_error" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_participant_reports_participant" UNIQUE("participant_id")
);
--> statement-breakpoint
ALTER TABLE "quiz_participant_report" ADD CONSTRAINT "quiz_participant_report_session_id_quiz_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_session"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_participant_report" ADD CONSTRAINT "quiz_participant_report_participant_id_quiz_session_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."quiz_session_participant"("id") ON DELETE cascade ON UPDATE no action;
