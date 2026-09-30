CREATE TABLE IF NOT EXISTS "quiz_event_material" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"admin_id" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"s3_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_event_material_chunk" (
	"id" text PRIMARY KEY NOT NULL,
	"material_id" text NOT NULL,
	"event_id" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"page_number" integer,
	"slide_number" integer,
	"text" text NOT NULL,
	"embedding" jsonb,
	"token_count" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_event_material_chunk_material_index" UNIQUE("material_id","chunk_index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_question_source_citation" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"material_id" text NOT NULL,
	"file_name" text NOT NULL,
	"page_number" integer,
	"slide_number" integer,
	"excerpt" text NOT NULL,
	"chunk_id" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quiz_event_material" ADD CONSTRAINT "quiz_event_material_event_id_quiz_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."quiz_event"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quiz_event_material" ADD CONSTRAINT "quiz_event_material_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quiz_event_material_chunk" ADD CONSTRAINT "quiz_event_material_chunk_material_id_quiz_event_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."quiz_event_material"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quiz_event_material_chunk" ADD CONSTRAINT "quiz_event_material_chunk_event_id_quiz_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."quiz_event"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quiz_question_source_citation" ADD CONSTRAINT "quiz_question_source_citation_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quiz_question_source_citation" ADD CONSTRAINT "quiz_question_source_citation_material_id_quiz_event_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."quiz_event_material"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quiz_question_source_citation" ADD CONSTRAINT "quiz_question_source_citation_chunk_id_quiz_event_material_chunk_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."quiz_event_material_chunk"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_event_material_chunk_event_idx" ON "quiz_event_material_chunk" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_question_source_citation_question_idx" ON "quiz_question_source_citation" USING btree ("question_id");
