"use client";

import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import { StudentsManager } from "@/features/elective-polls/components/students-manager";

export default function ManageStudentsPage() {
  return (
    <div className="container mx-auto mt-8 mb-32 max-w-6xl space-y-6 px-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/elective-polls">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Elective Polls
        </Link>
      </Button>

      <StudentsManager />
    </div>
  );
}
