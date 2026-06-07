"use client";

import { useState } from "react";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DashboardStudent, ProfileWithUser } from "../lib/types";
import { ProfileDialog } from "./profile-dialog";

interface Props {
  student: DashboardStudent;
  onSuccess?: () => void;
}

export function CoordinatorStudentEdit({ student, onSuccess }: Props) {
  const [open, setOpen] = useState(false);

  const profile: ProfileWithUser = {
    id: student.userId,
    userId: student.userId,
    pgCgpa: student.pgCgpa,
    hasBacklog: student.hasBacklog,
    backlogCount: student.backlogCount,
    isPlacementEligible: true,
    batch: student.batch,
    tenthPercent: student.tenthPercent,
    twelthPercent: student.twelthPercent,
    degreeType: student.degreeType,
    degreeCgpa: student.degreeCgpa,
    gender: student.gender,
    category: student.category,
    createdAt: new Date(),
    user: {
      id: student.userId,
      name: student.name,
      email: student.email,
    },
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => setOpen(true)}
        title={`Edit ${student.name ?? "student"}'s profile`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <ProfileDialog
        open={open}
        onOpenChange={setOpen}
        editProfile={profile}
        users={[]}
        onSuccess={() => {
          onSuccess?.();
          setOpen(false);
        }}
      />
    </>
  );
}
