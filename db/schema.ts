import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// User Table
export const user = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  github: text("github"),
  twitter: text("twitter"),
  peerlist: text("peerlist"),
  linkedin: text("linkedin"),
  portfolio: text("portfolio"),
  bio: text("bio"),
  isCoordinator: boolean("is_coordinator").notNull().default(false),
  isElectivePollAdmin: boolean("is_elective_poll_admin")
    .notNull()
    .default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  currentVideoNumber: integer("currentVideoNumber"),
  currentVideoLink: text("currentVideoLink"),
});

// Session Table
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$onUpdate(() => new Date()),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// Account Table
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { mode: "date" }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { mode: "date" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$onUpdate(() => new Date()),
});

// Verification Table
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Project Table
export const project = pgTable("project", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description").notNull(),
  body: jsonb("body"),
  liveLink: text("liveLink").notNull(),
  codeLink: text("codeLink"),

  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$onUpdate(() => new Date()),
});

// TechStack Table
export const techStack = pgTable("tech_stack", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  label: text("label").notNull(),
  image: text("image"),
  projectId: text("projectId")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

// List Table
export const list = pgTable("list", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  playlistLink: text("playlistLink"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$onUpdate(() => new Date()),
});

// ListProject Table
export const listProject = pgTable("list_project", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  listId: text("listId")
    .notNull()
    .references(() => list.id, { onDelete: "cascade" }),
  projectId: text("projectId")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

// SavedProject Table
export const savedProject = pgTable("saved_project", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  projectId: text("projectId")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

// Review Table
export const review = pgTable("review", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  design: integer("design").notNull(),
  userExperience: integer("userExperience").notNull(),
  creativity: integer("creativity").notNull(),
  functionality: integer("functionality").notNull(),
  hireability: integer("hireability").notNull(),
  remark: jsonb("remark"),
  videoNumber: integer("videoNumber"),
  videoLink: text("videoLink"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$onUpdate(() => new Date()),
});

// Question Table
export const question = pgTable("question", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  question: text("question").notNull(),
  type: text("type").notNull(), // 'yes-no' | 'short-answer'
  audience: text("audience").notNull(), // 'all' | 'cr-only'
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  requireName: boolean("require_name").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

// Response Table
export const response = pgTable(
  "response",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    answer: text("answer").notNull(),
    email: text("email").notNull(),
    studentName: text("student_name"),
    submittedAt: timestamp("submittedAt", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("response_question_email_unique").on(t.questionId, t.email)],
);

// Student Table (roster — source of truth for elective-poll audience eligibility)
export const student = pgTable("student", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  usn: text("usn").notNull().unique(),
  section: text("section").notNull(),
  email: text("email").notNull().unique(),
  batch: text("batch").notNull(),
});

// PlacementDrive Table
export const placementDrive = pgTable("placement_drive", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  deadline: timestamp("deadline", { mode: "date" }).notNull(),
  minPgCgpa: real("min_cgpa").notNull(),
  allowBacklog: boolean("allow_backlog").notNull().default(false),
  maxBacklogs: integer("max_backlogs").notNull().default(0),
  minTenthPercent: real("min_tenth_percent").notNull().default(0),
  minTwelthPercent: real("min_twelth_percent").notNull().default(0),
  minDegreeCgpa: real("min_degree_cgpa").notNull().default(0),
  genderAllowed: text("gender_allowed").notNull().default("All"),
  categoryAllowed: text("category_allowed").notNull().default("All"),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

// PlacementStudentProfile Table
export const placementStudentProfile = pgTable("placement_student_profile", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  pgCgpa: real("cgpa").notNull(),
  hasBacklog: boolean("has_backlog").notNull().default(false),
  backlogCount: integer("backlog_count").notNull().default(0),
  isPlacementEligible: boolean("is_placement_eligible").notNull().default(true),
  batch: text("batch").notNull(),
  tenthPercent: real("tenth_percent").notNull().default(0),
  twelthPercent: real("twelth_percent").notNull().default(0),
  degreeType: text("degree_type"),
  degreeCgpa: real("degree_cgpa"),
  gender: text("gender"),
  category: text("category"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

// PlacementResponse Table
export const placementResponse = pgTable(
  "placement_response",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    driveId: text("drive_id")
      .notNull()
      .references(() => placementDrive.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    hasRegistered: boolean("has_registered").notNull(),
    submittedAt: timestamp("submittedAt", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("placement_response_drive_user_unique").on(t.driveId, t.userId),
  ],
);

// PlacementAcademicRecord Table (pre-seeded from official data)
export const placementAcademicRecord = pgTable("placement_academic_record", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  usn: text("usn").notNull().unique(),
  name: text("name").notNull(),
  batch: text("batch").notNull().default("2024-26"),
  tenthPercent: real("tenth_percent").notNull().default(0),
  twelthPercent: real("twelth_percent").notNull().default(0),
  pgCgpa: real("pg_cgpa"),
  degreeType: text("degree_type").default("BCA"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

// Quiz Event Table
export const quizEvent = pgTable(
  "quiz_event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminId: text("admin_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("draft"),
    joinCode: text("join_code").unique(),
    logoUrl: text("logo_url"),
    themeId: text("theme_id").notNull().default("ocean"),
    customTheme: jsonb("custom_theme"),
    anonymousMode: boolean("anonymous_mode").notNull().default(false),
    autoPlayMode: boolean("auto_play_mode").notNull().default(false),
    enforceFocusMode: boolean("enforce_focus_mode").notNull().default(true),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("quiz_events_admin_title_unique").on(
      t.adminId,
      sql`lower(${t.title})`,
    ),
  ],
);

// Quiz Question Table
export const quizQuestion = pgTable(
  "quiz_question",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    eventId: text("event_id")
      .notNull()
      .references(() => quizEvent.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    questionType: text("question_type").notNull(),
    text: text("text").notNull(),
    imageUrl: text("image_url"),
    timeLimit: integer("time_limit").notNull().default(20),
    ratingMin: integer("rating_min"),
    ratingMax: integer("rating_max"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [unique("quiz_questions_event_position").on(t.eventId, t.position)],
);

// Quiz Answer Option Table
export const quizAnswerOption = pgTable(
  "quiz_answer_option",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    questionId: text("question_id")
      .notNull()
      .references(() => quizQuestion.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: text("text"),
    imageUrl: text("image_url"),
    isCorrect: boolean("is_correct").notNull().default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    unique("quiz_answer_options_question_position").on(
      t.questionId,
      t.position,
    ),
  ],
);

// Quiz Session Table
export const quizSession = pgTable("quiz_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id")
    .notNull()
    .references(() => quizEvent.id, { onDelete: "cascade" }),
  adminId: text("admin_id")
    .notNull()
    .references(() => user.id),
  status: text("status").notNull().default("lobby"),
  currentQuestionId: text("current_question_id").references(
    () => quizQuestion.id,
    { onDelete: "set null" },
  ),
  currentQuestionIndex: integer("current_question_index"),
  questionStartedAt: timestamp("question_started_at", { mode: "date" }),
  participantCount: integer("participant_count").notNull().default(0),
  startedAt: timestamp("started_at", { mode: "date" }),
  endedAt: timestamp("ended_at", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

// Quiz Session Participant Table
export const quizSessionParticipant = pgTable(
  "quiz_session_participant",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => quizSession.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    avatar: text("avatar").notNull(),
    totalScore: integer("total_score").notNull().default(0),
    rank: integer("rank"),
    isConnected: boolean("is_connected").notNull().default(true),
    disconnectedAt: timestamp("disconnected_at", { mode: "date" }),
    participantToken: text("participant_token").notNull().unique(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    unique("quiz_session_participants_session_display_name").on(
      t.sessionId,
      t.displayName,
    ),
  ],
);

// Quiz Participant Answer Table
export const quizParticipantAnswer = pgTable(
  "quiz_participant_answer",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => quizSession.id, { onDelete: "cascade" }),
    participantId: text("participant_id")
      .notNull()
      .references(() => quizSessionParticipant.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => quizQuestion.id, { onDelete: "cascade" }),
    selectedOptionIds: text("selected_option_ids").array(),
    openTextResponse: text("open_text_response"),
    ratingValue: integer("rating_value"),
    isCorrect: boolean("is_correct"),
    scoreAwarded: integer("score_awarded").notNull().default(0),
    responseTimeMs: integer("response_time_ms"),
    submittedAt: timestamp("submitted_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("quiz_participant_answers_participant_question").on(
      t.participantId,
      t.questionId,
    ),
  ],
);

// Quiz Analytics Snapshot Table
export const quizAnalyticsSnapshot = pgTable(
  "quiz_analytics_snapshot",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => quizSession.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => quizQuestion.id, { onDelete: "cascade" }),
    totalResponses: integer("total_responses").notNull().default(0),
    optionCounts: jsonb("option_counts").notNull().default({}),
    avgResponseTimeMs: integer("avg_response_time_ms"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    unique("quiz_analytics_snapshots_session_question").on(
      t.sessionId,
      t.questionId,
    ),
  ],
);

// Quiz Join Code History Table
export const quizJoinCodeHistory = pgTable("quiz_join_code_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id")
    .notNull()
    .references(() => quizEvent.id, { onDelete: "cascade" }),
  joinCode: text("join_code").notNull(),
  issuedAt: timestamp("issued_at", { mode: "date" }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { mode: "date" }),
});

// SmartForm Table
export const smartForm = pgTable("smart_forms", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  schema: jsonb("schema").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// SmartResponse Table
export const smartResponse = pgTable("smart_responses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  formId: text("form_id")
    .notNull()
    .references(() => smartForm.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull(),
  submittedBy: text("submitted_by"),
  submittedAt: timestamp("submittedAt", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Elective Poll Table
export const electivePoll = pgTable(
  "elective_poll",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("draft"), // 'draft' | 'open' | 'closed'
    audienceMode: text("audience_mode").notNull().default("all"), // 'all' | 'group' | 'custom'
    closesAt: timestamp("closes_at", { mode: "date" }), // advisory display only, not enforced
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("elective_polls_creator_title_unique").on(
      t.creatorId,
      sql`lower(${t.title})`,
    ),
  ],
);

// Elective Poll Option Table
export const electivePollOption = pgTable(
  "elective_poll_option",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pollId: text("poll_id")
      .notNull()
      .references(() => electivePoll.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    description: text("description"),
    capacity: integer("capacity").notNull(),
    seatsTaken: integer("seats_taken").notNull().default(0), // only ever mutated by the atomic reserve-seat statement
    position: integer("position").notNull(),
    status: text("status").notNull().default("active"), // 'active' | 'archived'
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("elective_poll_options_poll_position").on(t.pollId, t.position),
  ],
);

// Elective Poll Audience Rule Table
export const electivePollAudienceRule = pgTable(
  "elective_poll_audience_rule",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pollId: text("poll_id")
      .notNull()
      .references(() => electivePoll.id, { onDelete: "cascade" }),
    batch: text("batch").notNull(),
    section: text("section"), // null = every section within that batch
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    // Group mode is single-select (one target group per poll) — a plain
    // unique on pollId alone caps every poll at exactly one rule row.
    uniqueIndex("elective_poll_audience_rule_poll_id_unique").on(t.pollId),
  ],
);

// Elective Poll Audience Member Table — explicit per-student allow-list,
// used when a poll's audienceMode is 'custom' instead of 'group'.
export const electivePollAudienceMember = pgTable(
  "elective_poll_audience_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pollId: text("poll_id")
      .notNull()
      .references(() => electivePoll.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    unique("elective_poll_audience_member_poll_student_unique").on(
      t.pollId,
      t.studentId,
    ),
  ],
);

// Elective Poll Audience Exclusion Table — students explicitly excluded from
// an otherwise-matching 'group' audience (e.g. "whole batch except these 15
// students already shortlisted elsewhere"). Only meaningful when
// audienceMode is 'group'.
export const electivePollAudienceExclusion = pgTable(
  "elective_poll_audience_exclusion",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pollId: text("poll_id")
      .notNull()
      .references(() => electivePoll.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    unique("elective_poll_audience_exclusion_poll_student_unique").on(
      t.pollId,
      t.studentId,
    ),
  ],
);

// Elective Poll Response Table — one row per student per poll
export const electivePollResponse = pgTable(
  "elective_poll_response",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pollId: text("poll_id")
      .notNull()
      .references(() => electivePoll.id, { onDelete: "cascade" }),
    optionId: text("option_id")
      .notNull()
      .references(() => electivePollOption.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Snapshot of roster identity at submission time (roster rows can change later; this is the audit trail)
    studentUsn: text("student_usn"),
    studentName: text("student_name"),
    studentBatch: text("student_batch"),
    studentSection: text("student_section"),
    // Set only when this response was submitted through a selective reopen
    // grant (poll was closed at submission time) — lets the admin see which
    // remark authorized a given late response. Null for every ordinary
    // submission to an open poll. SET NULL (not cascade) so the response
    // itself is never affected if the grant row is ever removed.
    reopenGrantId: text("reopen_grant_id").references(
      (): AnyPgColumn => electivePollReopenGrant.id,
      { onDelete: "set null" },
    ),
    submittedAt: timestamp("submitted_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("elective_poll_response_poll_user_unique").on(t.pollId, t.userId),
  ],
);

// Elective Poll Reopen Grant Table — lets an admin selectively let specific
// non-responders back into a *closed* poll (e.g. a handful of stragglers who
// missed the deadline) without reopening it for the whole original audience.
// Kept as an audit trail rather than a simple toggle: revoking sets
// revokedAt/revokedBy instead of deleting the row, and a revoke-then-regrant
// always inserts a fresh row, so the full history of who was granted late
// access, when, why, and by whom is never lost.
export const electivePollReopenGrant = pgTable(
  "elective_poll_reopen_grant",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pollId: text("poll_id")
      .notNull()
      .references(() => electivePoll.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    remarks: text("remarks").notNull(),
    grantedBy: text("granted_by").references(() => user.id, {
      onDelete: "set null",
    }),
    grantedAt: timestamp("granted_at", { mode: "date" }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { mode: "date" }),
    revokedBy: text("revoked_by").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    // Only one *active* (non-revoked) grant per student per poll at a time —
    // re-granting an already-active grant updates it in place; a
    // revoke-then-regrant inserts a new row, preserving the old one.
    uniqueIndex("elective_poll_reopen_grant_poll_student_active_unique")
      .on(t.pollId, t.studentId)
      .where(sql`${t.revokedAt} is null`),
    index("elective_poll_reopen_grant_poll_id_idx").on(t.pollId),
  ],
);

// Elective Poll Collaborator Table — lets a poll's creator (or, once
// accepted, any collaborator) invite other elective-poll admins to manage
// this specific poll. Invites are request+accept: a row starts 'pending' and
// only grants access once flipped to 'accepted' by the invitee themselves
// (see collaborators.ts's respondToInvite). Unlike the reopen-grant table,
// there's no requirement to preserve accept/decline history here, so a
// plain (not partial) unique on (pollId, userId) is enough — re-inviting a
// declined collaborator just upserts the same row back to 'pending'.
export const electivePollCollaborator = pgTable(
  "elective_poll_collaborator",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()), // also used directly as the email accept-link token
    pollId: text("poll_id")
      .notNull()
      .references(() => electivePoll.id, { onDelete: "cascade" }),
    // The invitee's email (always lowercase) is the durable identity for an
    // invite — userId is only populated once an account can be resolved,
    // either at invite time (if one already exists) or lazily the first
    // time the matching-email visitor opens their invite (see
    // collaborators.ts's findInviteForViewer). This lets an admin invite
    // someone who has never signed into the site yet (e.g. a faculty member
    // on the allowlist with no account), which a userId-only FK could never
    // represent.
    inviteEmail: text("invite_email").notNull(),
    userId: text("user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'declined'
    invitedBy: text("invited_by").references(() => user.id, {
      onDelete: "set null",
    }),
    invitedAt: timestamp("invited_at", { mode: "date" }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { mode: "date" }),
  },
  (t) => [
    unique("elective_poll_collaborator_poll_invite_email_unique").on(
      t.pollId,
      t.inviteEmail,
    ),
    index("elective_poll_collaborator_poll_id_idx").on(t.pollId),
    index("elective_poll_collaborator_user_id_idx").on(t.userId),
  ],
);

// Relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  lists: many(list),
  savedProjects: many(savedProject),
  reviews: many(review),
  placementProfile: many(placementStudentProfile),
  placementResponses: many(placementResponse),
  quizEvents: many(quizEvent),
  quizSessions: many(quizSession),
  smartForms: many(smartForm),
  electivePolls: many(electivePoll),
  electivePollResponses: many(electivePollResponse),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const projectRelations = relations(project, ({ many }) => ({
  techStack: many(techStack),
  savedBy: many(savedProject),
  listProjects: many(listProject),
  reviews: many(review),
}));

export const techStackRelations = relations(techStack, ({ one }) => ({
  project: one(project, {
    fields: [techStack.projectId],
    references: [project.id],
  }),
}));

export const listRelations = relations(list, ({ one, many }) => ({
  user: one(user, {
    fields: [list.userId],
    references: [user.id],
  }),
  listProjects: many(listProject),
}));

export const listProjectRelations = relations(listProject, ({ one }) => ({
  list: one(list, {
    fields: [listProject.listId],
    references: [list.id],
  }),
  project: one(project, {
    fields: [listProject.projectId],
    references: [project.id],
  }),
}));

export const savedProjectRelations = relations(savedProject, ({ one }) => ({
  user: one(user, {
    fields: [savedProject.userId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [savedProject.projectId],
    references: [project.id],
  }),
}));

export const reviewRelations = relations(review, ({ one }) => ({
  user: one(user, {
    fields: [review.userId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [review.projectId],
    references: [project.id],
  }),
}));

export const questionRelations = relations(question, ({ many }) => ({
  responses: many(response),
}));

export const responseRelations = relations(response, ({ one }) => ({
  question: one(question, {
    fields: [response.questionId],
    references: [question.id],
  }),
}));

export const placementDriveRelations = relations(
  placementDrive,
  ({ many }) => ({
    responses: many(placementResponse),
  }),
);

export const placementStudentProfileRelations = relations(
  placementStudentProfile,
  ({ one }) => ({
    user: one(user, {
      fields: [placementStudentProfile.userId],
      references: [user.id],
    }),
  }),
);

export const placementResponseRelations = relations(
  placementResponse,
  ({ one }) => ({
    drive: one(placementDrive, {
      fields: [placementResponse.driveId],
      references: [placementDrive.id],
    }),
    user: one(user, {
      fields: [placementResponse.userId],
      references: [user.id],
    }),
  }),
);

export const quizEventRelations = relations(quizEvent, ({ one, many }) => ({
  admin: one(user, {
    fields: [quizEvent.adminId],
    references: [user.id],
  }),
  questions: many(quizQuestion),
  sessions: many(quizSession),
  joinCodeHistory: many(quizJoinCodeHistory),
}));

export const quizQuestionRelations = relations(
  quizQuestion,
  ({ one, many }) => ({
    event: one(quizEvent, {
      fields: [quizQuestion.eventId],
      references: [quizEvent.id],
    }),
    answerOptions: many(quizAnswerOption),
    participantAnswers: many(quizParticipantAnswer),
    analyticsSnapshots: many(quizAnalyticsSnapshot),
    currentSessions: many(quizSession),
  }),
);

export const quizAnswerOptionRelations = relations(
  quizAnswerOption,
  ({ one }) => ({
    question: one(quizQuestion, {
      fields: [quizAnswerOption.questionId],
      references: [quizQuestion.id],
    }),
  }),
);

export const quizSessionRelations = relations(quizSession, ({ one, many }) => ({
  event: one(quizEvent, {
    fields: [quizSession.eventId],
    references: [quizEvent.id],
  }),
  admin: one(user, {
    fields: [quizSession.adminId],
    references: [user.id],
  }),
  currentQuestion: one(quizQuestion, {
    fields: [quizSession.currentQuestionId],
    references: [quizQuestion.id],
  }),
  participants: many(quizSessionParticipant),
  answers: many(quizParticipantAnswer),
  analyticsSnapshots: many(quizAnalyticsSnapshot),
}));

export const quizSessionParticipantRelations = relations(
  quizSessionParticipant,
  ({ one, many }) => ({
    session: one(quizSession, {
      fields: [quizSessionParticipant.sessionId],
      references: [quizSession.id],
    }),
    answers: many(quizParticipantAnswer),
  }),
);

export const quizParticipantAnswerRelations = relations(
  quizParticipantAnswer,
  ({ one }) => ({
    session: one(quizSession, {
      fields: [quizParticipantAnswer.sessionId],
      references: [quizSession.id],
    }),
    participant: one(quizSessionParticipant, {
      fields: [quizParticipantAnswer.participantId],
      references: [quizSessionParticipant.id],
    }),
    question: one(quizQuestion, {
      fields: [quizParticipantAnswer.questionId],
      references: [quizQuestion.id],
    }),
  }),
);

export const quizAnalyticsSnapshotRelations = relations(
  quizAnalyticsSnapshot,
  ({ one }) => ({
    session: one(quizSession, {
      fields: [quizAnalyticsSnapshot.sessionId],
      references: [quizSession.id],
    }),
    question: one(quizQuestion, {
      fields: [quizAnalyticsSnapshot.questionId],
      references: [quizQuestion.id],
    }),
  }),
);

export const quizJoinCodeHistoryRelations = relations(
  quizJoinCodeHistory,
  ({ one }) => ({
    event: one(quizEvent, {
      fields: [quizJoinCodeHistory.eventId],
      references: [quizEvent.id],
    }),
  }),
);

export const smartFormRelations = relations(smartForm, ({ one, many }) => ({
  creator: one(user, {
    fields: [smartForm.createdBy],
    references: [user.id],
  }),
  responses: many(smartResponse),
}));

export const smartResponseRelations = relations(smartResponse, ({ one }) => ({
  form: one(smartForm, {
    fields: [smartResponse.formId],
    references: [smartForm.id],
  }),
}));

export const electivePollRelations = relations(
  electivePoll,
  ({ one, many }) => ({
    creator: one(user, {
      fields: [electivePoll.creatorId],
      references: [user.id],
    }),
    options: many(electivePollOption),
    audienceRules: many(electivePollAudienceRule),
    audienceMembers: many(electivePollAudienceMember),
    audienceExclusions: many(electivePollAudienceExclusion),
    responses: many(electivePollResponse),
    reopenGrants: many(electivePollReopenGrant),
    collaborators: many(electivePollCollaborator),
  }),
);

export const electivePollOptionRelations = relations(
  electivePollOption,
  ({ one, many }) => ({
    poll: one(electivePoll, {
      fields: [electivePollOption.pollId],
      references: [electivePoll.id],
    }),
    responses: many(electivePollResponse),
  }),
);

export const electivePollAudienceRuleRelations = relations(
  electivePollAudienceRule,
  ({ one }) => ({
    poll: one(electivePoll, {
      fields: [electivePollAudienceRule.pollId],
      references: [electivePoll.id],
    }),
  }),
);

export const electivePollAudienceMemberRelations = relations(
  electivePollAudienceMember,
  ({ one }) => ({
    poll: one(electivePoll, {
      fields: [electivePollAudienceMember.pollId],
      references: [electivePoll.id],
    }),
    student: one(student, {
      fields: [electivePollAudienceMember.studentId],
      references: [student.id],
    }),
  }),
);

export const electivePollAudienceExclusionRelations = relations(
  electivePollAudienceExclusion,
  ({ one }) => ({
    poll: one(electivePoll, {
      fields: [electivePollAudienceExclusion.pollId],
      references: [electivePoll.id],
    }),
    student: one(student, {
      fields: [electivePollAudienceExclusion.studentId],
      references: [student.id],
    }),
  }),
);

export const electivePollResponseRelations = relations(
  electivePollResponse,
  ({ one }) => ({
    poll: one(electivePoll, {
      fields: [electivePollResponse.pollId],
      references: [electivePoll.id],
    }),
    option: one(electivePollOption, {
      fields: [electivePollResponse.optionId],
      references: [electivePollOption.id],
    }),
    user: one(user, {
      fields: [electivePollResponse.userId],
      references: [user.id],
    }),
    reopenGrant: one(electivePollReopenGrant, {
      fields: [electivePollResponse.reopenGrantId],
      references: [electivePollReopenGrant.id],
    }),
  }),
);

export const electivePollReopenGrantRelations = relations(
  electivePollReopenGrant,
  ({ one }) => ({
    poll: one(electivePoll, {
      fields: [electivePollReopenGrant.pollId],
      references: [electivePoll.id],
    }),
    student: one(student, {
      fields: [electivePollReopenGrant.studentId],
      references: [student.id],
    }),
    grantedByUser: one(user, {
      fields: [electivePollReopenGrant.grantedBy],
      references: [user.id],
    }),
    revokedByUser: one(user, {
      fields: [electivePollReopenGrant.revokedBy],
      references: [user.id],
    }),
  }),
);

export const electivePollCollaboratorRelations = relations(
  electivePollCollaborator,
  ({ one }) => ({
    poll: one(electivePoll, {
      fields: [electivePollCollaborator.pollId],
      references: [electivePoll.id],
    }),
    user: one(user, {
      fields: [electivePollCollaborator.userId],
      references: [user.id],
    }),
    invitedByUser: one(user, {
      fields: [electivePollCollaborator.invitedBy],
      references: [user.id],
    }),
  }),
);
