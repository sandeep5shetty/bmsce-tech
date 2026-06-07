ALTER TABLE "placement_drive" ADD COLUMN "max_backlogs" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_drive" ADD COLUMN "min_tenth_percent" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_drive" ADD COLUMN "min_twelth_percent" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_drive" ADD COLUMN "min_degree_cgpa" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_drive" ADD COLUMN "gender_allowed" text DEFAULT 'All' NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_drive" ADD COLUMN "category_allowed" text DEFAULT 'All' NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_student_profile" ADD COLUMN "backlog_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_student_profile" ADD COLUMN "is_placement_eligible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_student_profile" ADD COLUMN "tenth_percent" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_student_profile" ADD COLUMN "twelth_percent" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_student_profile" ADD COLUMN "degree_type" text;--> statement-breakpoint
ALTER TABLE "placement_student_profile" ADD COLUMN "degree_cgpa" real;--> statement-breakpoint
ALTER TABLE "placement_student_profile" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "placement_student_profile" ADD COLUMN "category" text;