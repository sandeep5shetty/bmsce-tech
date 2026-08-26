CREATE TABLE "interview_experience_resource" (
	"id" text PRIMARY KEY NOT NULL,
	"experience_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interview_experience_resource" ADD CONSTRAINT "interview_experience_resource_experience_id_interview_experience_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."interview_experience"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interview_experience_resource_experience_idx" ON "interview_experience_resource" USING btree ("experience_id");