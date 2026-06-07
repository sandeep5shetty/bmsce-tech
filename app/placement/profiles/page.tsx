import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { getIsCoordinator } from "@/actions/user";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { AcademicRecordsSection } from "@/features/placement/components/academic-records-section";
import { ProfilesManager } from "@/features/placement/components/profiles-manager";
import {
  getAllAcademicRecords,
  getAllProfiles,
  getAllUsers,
} from "@/features/placement/lib/actions";
import { ProfileWithUser } from "@/features/placement/lib/types";

export default async function ProfilesPage() {
  const isCoordinator = await getIsCoordinator();
  if (!isCoordinator) redirect("/placement");

  const [rawProfiles, users, academicRecords] = await Promise.all([
    getAllProfiles(),
    getAllUsers(),
    getAllAcademicRecords(),
  ]);

  const profiles: ProfileWithUser[] = rawProfiles.map((p) => ({
    id: p.id,
    userId: p.userId,
    pgCgpa: p.pgCgpa,
    hasBacklog: p.hasBacklog,
    backlogCount: p.backlogCount,
    isPlacementEligible: p.isPlacementEligible,
    batch: p.batch,
    tenthPercent: p.tenthPercent,
    twelthPercent: p.twelthPercent,
    degreeType: p.degreeType,
    degreeCgpa: p.degreeCgpa,
    gender: p.gender,
    category: p.category,
    createdAt: p.createdAt,
    user: { id: p.userId, name: p.name, email: p.email },
  }));

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-6xl space-y-6 px-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/placement">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to drives
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-serif text-2xl font-semibold">Student Profiles</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage academic data and eligibility status for all placement drives.
        </p>
      </div>

      <ProfilesManager initialProfiles={profiles} users={users} />

      <Separator />

      <div>
        <h2 className="font-serif text-xl font-semibold">Academic Records</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          All 114 students from the official batch list. Click <strong>Link</strong> to connect a
          record to a registered user account and create their placement profile.
        </p>
      </div>

      <AcademicRecordsSection records={academicRecords} users={users} />
    </div>
  );
}
