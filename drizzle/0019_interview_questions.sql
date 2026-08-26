CREATE TABLE "interview_question" (
	"id" text PRIMARY KEY NOT NULL,
	"round_id" text NOT NULL,
	"experience_id" text NOT NULL,
	"question_text" text NOT NULL,
	"topic" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interview_question" ADD CONSTRAINT "interview_question_round_id_interview_experience_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."interview_experience_round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_question" ADD CONSTRAINT "interview_question_experience_id_interview_experience_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."interview_experience"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interview_question_experience_idx" ON "interview_question" USING btree ("experience_id");--> statement-breakpoint
CREATE INDEX "interview_question_round_idx" ON "interview_question" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "interview_question_topic_idx" ON "interview_question" USING btree ("topic");