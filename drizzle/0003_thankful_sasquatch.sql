CREATE TABLE "question" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"type" text NOT NULL,
	"audience" text NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"require_name" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"answer" text NOT NULL,
	"email" text NOT NULL,
	"student_name" text,
	"submittedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "response_question_email_unique" UNIQUE("question_id","email")
);
--> statement-breakpoint
CREATE TABLE "student" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"usn" text NOT NULL,
	"section" text NOT NULL,
	"email" text NOT NULL,
	CONSTRAINT "student_usn_unique" UNIQUE("usn"),
	CONSTRAINT "student_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "response" ADD CONSTRAINT "response_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;