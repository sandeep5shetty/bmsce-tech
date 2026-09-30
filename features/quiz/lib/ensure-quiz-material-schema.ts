import { neon } from "@neondatabase/serverless";

let ensured = false;

/**
 * Idempotent DDL for quiz RAG tables. Safe to call before materials APIs
 * when migrations 0029 have not been applied yet.
 */
export async function ensureQuizMaterialTables(): Promise<void> {
  if (ensured) return;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const sql = neon(databaseUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_event_material (
      id text PRIMARY KEY NOT NULL,
      event_id text NOT NULL,
      admin_id text NOT NULL,
      file_name text NOT NULL,
      content_type text NOT NULL,
      s3_key text NOT NULL,
      status text DEFAULT 'pending' NOT NULL,
      error text,
      chunk_count integer DEFAULT 0 NOT NULL,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_event_material_chunk (
      id text PRIMARY KEY NOT NULL,
      material_id text NOT NULL,
      event_id text NOT NULL,
      chunk_index integer NOT NULL,
      page_number integer,
      slide_number integer,
      text text NOT NULL,
      embedding jsonb,
      token_count integer,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT quiz_event_material_chunk_material_index UNIQUE(material_id, chunk_index)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_question_source_citation (
      id text PRIMARY KEY NOT NULL,
      question_id text NOT NULL,
      material_id text NOT NULL,
      file_name text NOT NULL,
      page_number integer,
      slide_number integer,
      excerpt text NOT NULL,
      chunk_id text,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE quiz_event_material
        ADD CONSTRAINT quiz_event_material_event_id_quiz_event_id_fk
        FOREIGN KEY (event_id) REFERENCES quiz_event(id) ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE quiz_event_material
        ADD CONSTRAINT quiz_event_material_admin_id_user_id_fk
        FOREIGN KEY (admin_id) REFERENCES "user"(id) ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE quiz_event_material_chunk
        ADD CONSTRAINT quiz_event_material_chunk_material_id_quiz_event_material_id_fk
        FOREIGN KEY (material_id) REFERENCES quiz_event_material(id) ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE quiz_event_material_chunk
        ADD CONSTRAINT quiz_event_material_chunk_event_id_quiz_event_id_fk
        FOREIGN KEY (event_id) REFERENCES quiz_event(id) ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE quiz_question_source_citation
        ADD CONSTRAINT quiz_question_source_citation_question_id_quiz_question_id_fk
        FOREIGN KEY (question_id) REFERENCES quiz_question(id) ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE quiz_question_source_citation
        ADD CONSTRAINT quiz_question_source_citation_material_id_quiz_event_material_id_fk
        FOREIGN KEY (material_id) REFERENCES quiz_event_material(id) ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE quiz_question_source_citation
        ADD CONSTRAINT quiz_question_source_citation_chunk_id_quiz_event_material_chunk_id_fk
        FOREIGN KEY (chunk_id) REFERENCES quiz_event_material_chunk(id) ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS quiz_event_material_chunk_event_idx
      ON quiz_event_material_chunk (event_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS quiz_question_source_citation_question_idx
      ON quiz_question_source_citation (question_id)
  `;

  ensured = true;
}

export function isMissingQuizMaterialTableError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const message =
    "message" in error ? String((error as { message: unknown }).message) : "";
  if (message.includes('relation "quiz_event_material" does not exist')) {
    return true;
  }
  const code =
    "code" in error ? String((error as { code: unknown }).code) : undefined;
  if (code === "42P01") return true;
  const cause = "cause" in error ? (error as { cause: unknown }).cause : null;
  if (typeof cause === "object" && cause !== null) {
    if ("code" in cause && String((cause as { code: unknown }).code) === "42P01") {
      return true;
    }
    if (
      "message" in cause &&
      String((cause as { message: unknown }).message).includes(
        "quiz_event_material",
      )
    ) {
      return true;
    }
  }
  return false;
}

export function formatQuizMaterialDbError(error: unknown): string {
  if (isMissingQuizMaterialTableError(error)) {
    return "Course materials storage is not set up. Run migration 0029 or: npx tsx scripts/ensure-quiz-event-materials.ts";
  }
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (code === "23503") {
      return "Could not save material (invalid event or admin reference).";
    }
  }
  if (error instanceof Error) return error.message;
  return "Database error while saving material.";
}
