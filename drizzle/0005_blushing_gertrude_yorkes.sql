CREATE TABLE "placement_academic_record" (
	"id" text PRIMARY KEY NOT NULL,
	"usn" text NOT NULL,
	"name" text NOT NULL,
	"batch" text DEFAULT '2024-26' NOT NULL,
	"tenth_percent" real DEFAULT 0 NOT NULL,
	"twelth_percent" real DEFAULT 0 NOT NULL,
	"pg_cgpa" real,
	"degree_type" text DEFAULT 'BCA',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "placement_academic_record_usn_unique" UNIQUE("usn")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_coordinator" boolean DEFAULT false NOT NULL;