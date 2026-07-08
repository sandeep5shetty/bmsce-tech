CREATE TABLE "smart_forms" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"schema" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "smart_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"answers" jsonb NOT NULL,
	"submitted_by" text,
	"submittedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "smart_forms" ADD CONSTRAINT "smart_forms_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_responses" ADD CONSTRAINT "smart_responses_form_id_smart_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."smart_forms"("id") ON DELETE cascade ON UPDATE no action;
