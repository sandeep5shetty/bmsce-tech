import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS quiz_participant_report (
      id text PRIMARY KEY NOT NULL,
      session_id text NOT NULL,
      participant_id text NOT NULL,
      ai_status text DEFAULT 'idle' NOT NULL,
      ai_feedback jsonb,
      ai_error text,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT quiz_participant_reports_participant UNIQUE(participant_id)
    )
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE quiz_participant_report
        ADD CONSTRAINT quiz_participant_report_session_id_quiz_session_id_fk
        FOREIGN KEY (session_id) REFERENCES quiz_session(id) ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE quiz_participant_report
        ADD CONSTRAINT quiz_participant_report_participant_id_quiz_session_participant_id_fk
        FOREIGN KEY (participant_id) REFERENCES quiz_session_participant(id) ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    ALTER TABLE quiz_participant_report
      ADD COLUMN IF NOT EXISTS pdf_status text DEFAULT 'idle' NOT NULL
  `;
  await sql`
    ALTER TABLE quiz_participant_report
      ADD COLUMN IF NOT EXISTS pdf_s3_key text
  `;
  await sql`
    ALTER TABLE quiz_participant_report
      ADD COLUMN IF NOT EXISTS pdf_content_hash text
  `;
  await sql`
    ALTER TABLE quiz_participant_report
      ADD COLUMN IF NOT EXISTS pdf_error text
  `;
  await sql`
    ALTER TABLE quiz_participant_report
      ADD COLUMN IF NOT EXISTS pdf_generated_at timestamp
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_session_report_feedback (
      id text PRIMARY KEY NOT NULL,
      session_id text NOT NULL,
      participant_id text NOT NULL,
      display_name text NOT NULL,
      is_anonymous boolean DEFAULT false NOT NULL,
      rating integer NOT NULL,
      feedback_text text NOT NULL,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT quiz_session_report_feedback_participant UNIQUE(session_id, participant_id)
    )
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE quiz_session_report_feedback
        ADD CONSTRAINT quiz_session_report_feedback_session_id_quiz_session_id_fk
        FOREIGN KEY (session_id) REFERENCES quiz_session(id) ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE quiz_session_report_feedback
        ADD CONSTRAINT quiz_session_report_feedback_participant_id_quiz_session_participant_id_fk
        FOREIGN KEY (participant_id) REFERENCES quiz_session_participant(id) ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  console.log(
    "quiz_participant_report and quiz_session_report_feedback are ready",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
