"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Copy, Download, Lock, Trash2, Unlock } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { PlacementDrive } from "@/types";

import { deleteDrive, lockDrive } from "../lib/actions";
import { DashboardStudent } from "../lib/types";

interface DashboardActionsProps {
  drive: PlacementDrive;
  pending: DashboardStudent[];
  allStudents: DashboardStudent[];
}

export function DashboardActions({
  drive,
  pending,
  allStudents,
}: DashboardActionsProps) {
  const router = useRouter();
  const [locking, setLocking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleLock() {
    setLocking(true);
    try {
      await lockDrive(drive.id);
      toast.success(drive.isLocked ? "Drive unlocked." : "Drive locked.");
      window.location.reload();
    } catch {
      toast.error("Failed to update drive status.");
    } finally {
      setLocking(false);
    }
  }

  function handleExportCSV() {
    const headers = [
      "Name",
      "Email",
      "MCA CGPA",
      "10th %",
      "12th %",
      "Degree Type",
      "Degree CGPA",
      "Backlog Count",
      "Has Backlog",
      "Gender",
      "Category",
      "Batch",
      "Response",
      "Submitted At",
    ];

    const rows = allStudents.map((s) => [
      s.name ?? "Unnamed",
      s.email,
      s.pgCgpa.toFixed(2),
      s.tenthPercent?.toFixed(1) ?? "",
      s.twelthPercent?.toFixed(1) ?? "",
      s.degreeType ?? "",
      s.degreeCgpa?.toFixed(2) ?? "",
      String(s.backlogCount ?? 0),
      s.hasBacklog ? "Yes" : "No",
      s.gender ?? "",
      s.category ?? "",
      s.batch,
      s.response === null
        ? "Pending"
        : s.response.hasRegistered
          ? "Registered"
          : "Not Registered",
      s.response?.submittedAt
        ? new Date(s.response.submittedAt).toLocaleString("en-IN")
        : "",
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${drive.title.replace(/\s+/g, "_")}_placement.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  }

  function handleCopyPending() {
    const names = pending.map((s) => s.name ?? s.email).join("\n");
    navigator.clipboard.writeText(names);
    toast.success(`Copied ${pending.length} pending student name(s).`);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDrive(drive.id);
      toast.success("Drive deleted.");
      router.push("/placement");
    } catch {
      toast.error("Failed to delete drive.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleLock}
        disabled={locking}
      >
        {drive.isLocked ? (
          <>
            <Unlock className="mr-1.5 h-4 w-4" /> Unlock Drive
          </>
        ) : (
          <>
            <Lock className="mr-1.5 h-4 w-4" /> Lock Drive
          </>
        )}
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportCSV}>
        <Download className="mr-1.5 h-4 w-4" /> Export CSV
      </Button>
      {pending.length > 0 && (
        <Button variant="outline" size="sm" onClick={handleCopyPending}>
          <Copy className="mr-1.5 h-4 w-4" /> Copy Pending Names ({pending.length})
        </Button>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={deleting}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            {deleting ? "Deleting..." : "Delete Drive"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{drive.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the drive and all{" "}
              {allStudents.length > 0
                ? `${allStudents.length} student response(s)`
                : "student responses"}{" "}
              recorded for it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, delete drive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
