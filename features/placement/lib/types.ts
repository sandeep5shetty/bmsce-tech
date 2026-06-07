import { PlacementDrive, PlacementStudentProfile, User } from "@/types";

export type DriveWithCount = PlacementDrive & { responseCount: number };

export type ProfileWithUser = PlacementStudentProfile & {
  user: Pick<User, "id" | "name" | "email">;
};

export type EligibilityResult =
  | { eligible: true; existingResponse: { hasRegistered: boolean; submittedAt: Date } | null }
  | { eligible: false; reasons: string[] };

export type DashboardStudent = {
  userId: string;
  name: string | null;
  email: string;
  pgCgpa: number;
  hasBacklog: boolean;
  backlogCount: number;
  batch: string;
  tenthPercent: number;
  twelthPercent: number;
  degreeType: string | null;
  degreeCgpa: number | null;
  gender: string | null;
  category: string | null;
  response: { hasRegistered: boolean; submittedAt: Date } | null;
};

export type DashboardData = {
  drive: PlacementDrive;
  registered: DashboardStudent[];
  notRegistered: DashboardStudent[];
  pending: DashboardStudent[];
};
