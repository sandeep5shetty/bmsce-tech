// Drizzle Schema Types
import * as schema from "@/db/schema";

// User Types
export type User = typeof schema.user.$inferSelect;
export type NewUser = typeof schema.user.$inferInsert;

// Session Types
export type Session = typeof schema.session.$inferSelect;
export type NewSession = typeof schema.session.$inferInsert;

// Account Types
export type Account = typeof schema.account.$inferSelect;
export type NewAccount = typeof schema.account.$inferInsert;

// Verification Types
export type Verification = typeof schema.verification.$inferSelect;
export type NewVerification = typeof schema.verification.$inferInsert;

// Project Types
export type Project = typeof schema.project.$inferSelect;
export type NewProject = typeof schema.project.$inferInsert;

// TechStack Types
export type TechStack = typeof schema.techStack.$inferSelect;
export type NewTechStack = typeof schema.techStack.$inferInsert;

// List Types
export type List = typeof schema.list.$inferSelect;
export type NewList = typeof schema.list.$inferInsert;

// ListProject Types
export type ListProject = typeof schema.listProject.$inferSelect;
export type NewListProject = typeof schema.listProject.$inferInsert;

// SavedProject Types
export type SavedProject = typeof schema.savedProject.$inferSelect;
export type NewSavedProject = typeof schema.savedProject.$inferInsert;
