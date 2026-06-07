import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
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

// Relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  lists: many(list),
  savedProjects: many(savedProject),
  reviews: many(review),
  placementProfile: many(placementStudentProfile),
  placementResponses: many(placementResponse),
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
