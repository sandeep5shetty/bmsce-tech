ALTER TABLE "interview_experience_resource" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "interview_experience" ADD COLUMN "jd_url" text;--> statement-breakpoint
ALTER TABLE "interview_experience" ADD COLUMN "jd_file_name" text;--> statement-breakpoint
ALTER TABLE "interview_experience_resource" ADD COLUMN "file_name" text;--> statement-breakpoint
ALTER TABLE "interview_experience_resource" ADD COLUMN "file_size" integer;