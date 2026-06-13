import { relations, sql } from "drizzle-orm";
import {
  boolean,
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

// Student Table (MCA 1st yr Sec B)
export const student = pgTable("student", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  usn: text("usn").notNull().unique(),
  section: text("section").notNull(),
  email: text("email").notNull().unique(),
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
    themeId: text("theme_id").notNull().default("default"),
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
