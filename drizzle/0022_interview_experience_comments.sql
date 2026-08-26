CREATE TABLE "interview_experience_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"experience_id" text NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interview_experience_comment" ADD CONSTRAINT "interview_experience_comment_experience_id_interview_experience_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."interview_experience"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_experience_comment" ADD CONSTRAINT "interview_experience_comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interview_experience_comment_experience_idx" ON "interview_experience_comment" USING btree ("experience_id");