ALTER TABLE "quiz_event" ADD COLUMN "auto_play_mode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_event" ADD COLUMN "enforce_focus_mode" boolean DEFAULT true NOT NULL;
