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
	"auto_play_mode" boolean DEFAULT false NOT NULL,
	"enforce_focus_mode" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_event_join_code_unique" UNIQUE("join_code")
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
CREATE TABLE "smart_forms" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"schema" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "smart_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"answers" jsonb NOT NULL,
	"submitted_by" text,
	"submittedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quiz_analytics_snapshot" ADD CONSTRAINT "quiz_analytics_snapshot_session_id_quiz_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_analytics_snapshot" ADD CONSTRAINT "quiz_analytics_snapshot_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answer_option" ADD CONSTRAINT "quiz_answer_option_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_event" ADD CONSTRAINT "quiz_event_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_join_code_history" ADD CONSTRAINT "quiz_join_code_history_event_id_quiz_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."quiz_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_participant_answer" ADD CONSTRAINT "quiz_participant_answer_session_id_quiz_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_participant_answer" ADD CONSTRAINT "quiz_participant_answer_participant_id_quiz_session_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."quiz_session_participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_participant_answer" ADD CONSTRAINT "quiz_participant_answer_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_event_id_quiz_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."quiz_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_event_id_quiz_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."quiz_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_current_question_id_quiz_question_id_fk" FOREIGN KEY ("current_question_id") REFERENCES "public"."quiz_question"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_session_participant" ADD CONSTRAINT "quiz_session_participant_session_id_quiz_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_forms" ADD CONSTRAINT "smart_forms_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_responses" ADD CONSTRAINT "smart_responses_form_id_smart_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."smart_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_events_admin_title_unique" ON "quiz_event" USING btree ("admin_id",lower("title"));