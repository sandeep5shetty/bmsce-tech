ALTER TABLE "quiz_participant_report" ADD COLUMN IF NOT EXISTS "pdf_status" text DEFAULT 'idle' NOT NULL;
--> statement-breakpoint
ALTER TABLE "quiz_participant_report" ADD COLUMN IF NOT EXISTS "pdf_s3_key" text;
--> statement-breakpoint
ALTER TABLE "quiz_participant_report" ADD COLUMN IF NOT EXISTS "pdf_content_hash" text;
--> statement-breakpoint
ALTER TABLE "quiz_participant_report" ADD COLUMN IF NOT EXISTS "pdf_error" text;
--> statement-breakpoint
ALTER TABLE "quiz_participant_report" ADD COLUMN IF NOT EXISTS "pdf_generated_at" timestamp;
