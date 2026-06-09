CREATE TABLE "quiz_event" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"join_code" text,
	"logo_url" text,
	"theme_id" text DEFAULT 'default' NOT NULL,
	"custom_theme" jsonb,
	"anonymous_mode" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_event_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "quiz_question" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"position" integer NOT NULL,
	"question_type" text NOT NULL,
	"text" text NOT NULL,
	"image_url" text,
	"time_limit" integer DEFAULT 20 NOT NULL,
	"rating_min" integer,
	"rating_max" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_questions_event_position" UNIQUE("event_id","position")
);
--> statement-breakpoint
CREATE TABLE "quiz_answer_option" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"position" integer NOT NULL,
	"text" text,
	"image_url" text,
	"is_correct" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_answer_options_question_position" UNIQUE("question_id","position")
);
--> statement-breakpoint
CREATE TABLE "quiz_session" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"admin_id" text NOT NULL,
	"status" text DEFAULT 'lobby' NOT NULL,
	"current_question_id" text,
	"current_question_index" integer,
	"question_started_at" timestamp,
	"participant_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_session_participant" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar" text NOT NULL,
	"total_score" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"is_connected" boolean DEFAULT true NOT NULL,
	"disconnected_at" timestamp,
	"participant_token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_session_participant_participant_token_unique" UNIQUE("participant_token"),
	CONSTRAINT "quiz_session_participants_session_display_name" UNIQUE("session_id","display_name")
);
--> statement-breakpoint
CREATE TABLE "quiz_participant_answer" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"question_id" text NOT NULL,
	"selected_option_ids" text[],
	"open_text_response" text,
	"rating_value" integer,
	"is_correct" boolean,
	"score_awarded" integer DEFAULT 0 NOT NULL,
	"response_time_ms" integer,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_participant_answers_participant_question" UNIQUE("participant_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_analytics_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"question_id" text NOT NULL,
	"total_responses" integer DEFAULT 0 NOT NULL,
	"option_counts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"avg_response_time_ms" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_analytics_snapshots_session_question" UNIQUE("session_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_join_code_history" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"join_code" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "quiz_event" ADD CONSTRAINT "quiz_event_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_event_id_quiz_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."quiz_event"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_answer_option" ADD CONSTRAINT "quiz_answer_option_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_event_id_quiz_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."quiz_event"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_current_question_id_quiz_question_id_fk" FOREIGN KEY ("current_question_id") REFERENCES "public"."quiz_question"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_session_participant" ADD CONSTRAINT "quiz_session_participant_session_id_quiz_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_session"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_participant_answer" ADD CONSTRAINT "quiz_participant_answer_session_id_quiz_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_session"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_participant_answer" ADD CONSTRAINT "quiz_participant_answer_participant_id_quiz_session_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."quiz_session_participant"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_participant_answer" ADD CONSTRAINT "quiz_participant_answer_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_analytics_snapshot" ADD CONSTRAINT "quiz_analytics_snapshot_session_id_quiz_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_session"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_analytics_snapshot" ADD CONSTRAINT "quiz_analytics_snapshot_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_join_code_history" ADD CONSTRAINT "quiz_join_code_history_event_id_quiz_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."quiz_event"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_events_admin_title_unique" ON "quiz_event" ("admin_id", lower("title"));
--> statement-breakpoint
ALTER TABLE "quiz_event" ADD CONSTRAINT "quiz_event_title_length" CHECK (char_length("title") BETWEEN 1 AND 100);
--> statement-breakpoint
ALTER TABLE "quiz_event" ADD CONSTRAINT "quiz_event_description_length" CHECK ("description" IS NULL OR char_length("description") <= 500);
--> statement-breakpoint
ALTER TABLE "quiz_event" ADD CONSTRAINT "quiz_event_status_check" CHECK ("status" IN ('draft', 'published'));
--> statement-breakpoint
ALTER TABLE "quiz_event" ADD CONSTRAINT "quiz_event_join_code_format" CHECK ("join_code" IS NULL OR "join_code" ~ '^[A-Z0-9]{6}$');
--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_type_check" CHECK ("question_type" IN ('single_select', 'multi_select', 'open_text', 'rating_scale', 'image_choice'));
--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_text_length" CHECK (char_length("text") BETWEEN 1 AND 255);
--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_time_limit_check" CHECK ("time_limit" BETWEEN 5 AND 120);
--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_rating_scale_valid" CHECK ("question_type" != 'rating_scale' OR ("rating_min" IS NOT NULL AND "rating_max" IS NOT NULL AND "rating_min" < "rating_max"));
--> statement-breakpoint
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_status_check" CHECK ("status" IN ('lobby', 'countdown', 'question', 'results', 'leaderboard', 'final_leaderboard', 'ended'));
--> statement-breakpoint
ALTER TABLE "quiz_session_participant" ADD CONSTRAINT "quiz_session_participant_display_name_check" CHECK (char_length("display_name") BETWEEN 1 AND 30 AND "display_name" ~ '^[[:alpha:][:digit:] \-_]+$');
--> statement-breakpoint
ALTER TABLE "quiz_participant_answer" ADD CONSTRAINT "quiz_participant_answer_open_text_length" CHECK ("open_text_response" IS NULL OR char_length("open_text_response") <= 200);
