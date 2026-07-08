-- 1. Permission flag
ALTER TABLE "user" ADD COLUMN "is_elective_poll_admin" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

-- 2. Generalize roster with a batch column (nullable add -> backfill -> lock down, zero-downtime safe)
ALTER TABLE "student" ADD COLUMN "batch" text;
--> statement-breakpoint
UPDATE "student" SET "batch" = '2025' WHERE "batch" IS NULL;
--> statement-breakpoint
ALTER TABLE "student" ALTER COLUMN "batch" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "student_batch_section_idx" ON "student" ("batch","section");
--> statement-breakpoint

-- 3. Elective poll tables
CREATE TABLE "elective_poll" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"closes_at" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "elective_poll_option" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"capacity" integer NOT NULL,
	"seats_taken" integer DEFAULT 0 NOT NULL,
	"position" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "elective_poll_options_poll_position" UNIQUE("poll_id","position")
);
--> statement-breakpoint
CREATE TABLE "elective_poll_audience_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"batch" text NOT NULL,
	"section" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "elective_poll_response" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"option_id" text NOT NULL,
	"user_id" text NOT NULL,
	"student_usn" text,
	"student_name" text,
	"student_batch" text,
	"student_section" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "elective_poll_response_poll_user_unique" UNIQUE("poll_id","user_id")
);
--> statement-breakpoint

ALTER TABLE "elective_poll" ADD CONSTRAINT "elective_poll_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_poll_option" ADD CONSTRAINT "elective_poll_option_poll_id_elective_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."elective_poll"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_poll_audience_rule" ADD CONSTRAINT "elective_poll_audience_rule_poll_id_elective_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."elective_poll"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_poll_response" ADD CONSTRAINT "elective_poll_response_poll_id_elective_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."elective_poll"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_poll_response" ADD CONSTRAINT "elective_poll_response_option_id_elective_poll_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."elective_poll_option"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_poll_response" ADD CONSTRAINT "elective_poll_response_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX "elective_polls_creator_title_unique" ON "elective_poll" ("creator_id", lower("title"));
--> statement-breakpoint
CREATE INDEX "elective_poll_option_poll_id_idx" ON "elective_poll_option" ("poll_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "elective_poll_audience_rules_poll_batch_section_unique" ON "elective_poll_audience_rule" ("poll_id", "batch", coalesce("section", ''));
--> statement-breakpoint
CREATE INDEX "elective_poll_response_poll_id_idx" ON "elective_poll_response" ("poll_id");
--> statement-breakpoint
CREATE INDEX "elective_poll_response_option_id_idx" ON "elective_poll_response" ("option_id");
--> statement-breakpoint

-- Defense-in-depth CHECK constraints (see drizzle/0006_quiz_platform.sql for existing precedent)
ALTER TABLE "elective_poll" ADD CONSTRAINT "elective_poll_status_check" CHECK ("status" IN ('draft', 'open', 'closed'));
--> statement-breakpoint
ALTER TABLE "elective_poll_option" ADD CONSTRAINT "elective_poll_option_status_check" CHECK ("status" IN ('active', 'archived'));
--> statement-breakpoint
ALTER TABLE "elective_poll_option" ADD CONSTRAINT "elective_poll_option_capacity_positive_check" CHECK ("capacity" > 0);
--> statement-breakpoint
ALTER TABLE "elective_poll_option" ADD CONSTRAINT "elective_poll_option_seats_non_negative_check" CHECK ("seats_taken" >= 0);
--> statement-breakpoint
ALTER TABLE "elective_poll_option" ADD CONSTRAINT "elective_poll_option_seats_within_capacity_check" CHECK ("seats_taken" <= "capacity");
