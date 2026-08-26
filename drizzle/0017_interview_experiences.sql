CREATE TABLE "interview_experience" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"drive_id" text,
	"company_name" text NOT NULL,
	"role" text NOT NULL,
	"batch" text NOT NULL,
	"result" text NOT NULL,
	"ctc_lpa" real,
	"overview" text NOT NULL,
	"preparation_resources" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_experience_round" (
	"id" text PRIMARY KEY NOT NULL,
	"experience_id" text NOT NULL,
	"round_number" integer NOT NULL,
	"round_type" text NOT NULL,
	"description" text NOT NULL,
	"difficulty" text
);
--> statement-breakpoint
ALTER TABLE "interview_experience" ADD CONSTRAINT "interview_experience_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_experience" ADD CONSTRAINT "interview_experience_drive_id_placement_drive_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."placement_drive"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_experience_round" ADD CONSTRAINT "interview_experience_round_experience_id_interview_experience_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."interview_experience"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interview_experience_round_experience_idx" ON "interview_experience_round" USING btree ("experience_id");
