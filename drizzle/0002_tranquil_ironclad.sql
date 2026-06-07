CREATE TABLE "placement_drive" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"deadline" timestamp NOT NULL,
	"min_cgpa" real NOT NULL,
	"allow_backlog" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement_response" (
	"id" text PRIMARY KEY NOT NULL,
	"drive_id" text NOT NULL,
	"user_id" text NOT NULL,
	"has_registered" boolean NOT NULL,
	"submittedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "placement_response_drive_user_unique" UNIQUE("drive_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "placement_student_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"cgpa" real NOT NULL,
	"has_backlog" boolean DEFAULT false NOT NULL,
	"batch" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "placement_student_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "placement_response" ADD CONSTRAINT "placement_response_drive_id_placement_drive_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."placement_drive"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_response" ADD CONSTRAINT "placement_response_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_student_profile" ADD CONSTRAINT "placement_student_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;