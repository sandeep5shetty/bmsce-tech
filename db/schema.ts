import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
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

// Relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  lists: many(list),
  savedProjects: many(savedProject),
  reviews: many(review),
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
