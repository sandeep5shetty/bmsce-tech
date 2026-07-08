-- 1. Poll audience mode: 'all' (any logged-in student) | 'group' (single roster
-- batch/section) | 'custom' (explicit per-student allow-list)
ALTER TABLE "elective_poll" ADD COLUMN "audience_mode" text DEFAULT 'all' NOT NULL;
--> statement-breakpoint
UPDATE "elective_poll" SET "audience_mode" = 'group'
WHERE id IN (SELECT DISTINCT poll_id FROM elective_poll_audience_rule);
--> statement-breakpoint
ALTER TABLE "elective_poll" ADD CONSTRAINT "elective_poll_audience_mode_check" CHECK ("audience_mode" IN ('all', 'group', 'custom'));
--> statement-breakpoint

-- 2. Group mode is single-select: at most one audience rule row per poll.
-- (No existing poll has more than one rule row, so this is safe to add directly.)
DROP INDEX IF EXISTS "elective_poll_audience_rules_poll_batch_section_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "elective_poll_audience_rule_poll_id_unique" ON "elective_poll_audience_rule" ("poll_id");
--> statement-breakpoint

-- 3. Custom-list audience mode: explicit per-student allow-list
CREATE TABLE "elective_poll_audience_member" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"student_id" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "elective_poll_audience_member_poll_student_unique" UNIQUE("poll_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "elective_poll_audience_member" ADD CONSTRAINT "elective_poll_audience_member_poll_id_elective_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."elective_poll"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_poll_audience_member" ADD CONSTRAINT "elective_poll_audience_member_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "elective_poll_audience_member_poll_id_idx" ON "elective_poll_audience_member" ("poll_id");
