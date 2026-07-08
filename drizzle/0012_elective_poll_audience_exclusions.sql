-- Students explicitly excluded from an otherwise-matching 'group' audience
-- (e.g. "whole batch except these 15 students already shortlisted elsewhere").
CREATE TABLE "elective_poll_audience_exclusion" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"student_id" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "elective_poll_audience_exclusion_poll_student_unique" UNIQUE("poll_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "elective_poll_audience_exclusion" ADD CONSTRAINT "elective_poll_audience_exclusion_poll_id_elective_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."elective_poll"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_poll_audience_exclusion" ADD CONSTRAINT "elective_poll_audience_exclusion_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "elective_poll_audience_exclusion_poll_id_idx" ON "elective_poll_audience_exclusion" ("poll_id");
