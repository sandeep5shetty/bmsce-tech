import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react";

import { getIsCoordinator } from "@/actions/user";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { CoordinatorStudentEdit } from "@/features/placement/components/coordinator-student-edit";
import { DashboardActions } from "@/features/placement/components/dashboard-actions";
import { getDashboardData } from "@/features/placement/lib/actions";
import { DashboardStudent } from "@/features/placement/lib/types";

function StudentRow({
  student,
  isCoordinator,
}: {
  student: DashboardStudent;
  isCoordinator: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium">{student.name ?? "Unnamed"}</p>
        <p className="text-muted-foreground text-xs">{student.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          <span>MCA {student.pgCgpa.toFixed(2)}</span>
          <span className="hidden sm:inline">{student.batch}</span>
          {student.backlogCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {student.backlogCount} backlog{student.backlogCount !== 1 ? "s" : ""}
            </Badge>
          )}
          {student.response && (
            <span className="text-muted-foreground">
              {new Date(student.response.submittedAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        {isCoordinator && <CoordinatorStudentEdit student={student} />}
      </div>
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getDashboardData(id);
  } catch {
    notFound();
  }

  const isCoordinator = await getIsCoordinator();

  const { drive, registered, notRegistered, pending } = data;
  const allStudents = [...registered, ...notRegistered, ...pending];
  const total = allStudents.length;

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-6xl space-y-6 px-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/placement">
            <ArrowLeft className="mr-1 h-4 w-4" />
            All drives
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold">{drive.title}</h1>
            {drive.isLocked && <Badge variant="secondary">Locked</Badge>}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Deadline:{" "}
            {new Date(drive.deadline).toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            &middot; Min MCA CGPA {drive.minPgCgpa.toFixed(1)}
            {drive.maxBacklogs > 0 ? ` · Max ${drive.maxBacklogs} backlog(s)` : drive.allowBacklog ? " · Backlog OK" : ""}
          </p>
        </div>
        {isCoordinator && (
          <DashboardActions drive={drive} pending={pending} allStudents={allStudents} />
        )}
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-muted rounded-lg px-4 py-2 text-sm">
          <span className="text-muted-foreground">Eligible</span>{" "}
          <strong>{total}</strong>
        </div>
        <div className="rounded-lg bg-green-100 px-4 py-2 text-sm dark:bg-green-900/30">
          <span className="text-green-700 dark:text-green-400">Registered</span>{" "}
          <strong className="text-green-800 dark:text-green-300">{registered.length}</strong>
        </div>
        <div className="rounded-lg bg-red-100 px-4 py-2 text-sm dark:bg-red-900/30">
          <span className="text-red-700 dark:text-red-400">Not Registered</span>{" "}
          <strong className="text-red-800 dark:text-red-300">{notRegistered.length}</strong>
        </div>
        <div className="bg-muted rounded-lg px-4 py-2 text-sm">
          <span className="text-muted-foreground">Pending</span>{" "}
          <strong>{pending.length}</strong>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {/* Registered */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              Registered on Superset ({registered.length})
            </CardTitle>
          </CardHeader>
          {registered.length > 0 && (
            <CardContent className="divide-y">
              {registered.map((s) => (
                <StudentRow key={s.userId} student={s} isCoordinator={isCoordinator} />
              ))}
            </CardContent>
          )}
          {registered.length === 0 && (
            <CardContent>
              <p className="text-muted-foreground text-sm">No responses yet.</p>
            </CardContent>
          )}
        </Card>

        {/* Not Registered */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-red-500 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              Not Registered ({notRegistered.length})
            </CardTitle>
          </CardHeader>
          {notRegistered.length > 0 && (
            <CardContent className="divide-y">
              {notRegistered.map((s) => (
                <StudentRow key={s.userId} student={s} isCoordinator={isCoordinator} />
              ))}
            </CardContent>
          )}
          {notRegistered.length === 0 && (
            <CardContent>
              <p className="text-muted-foreground text-sm">None.</p>
            </CardContent>
          )}
        </Card>

        {/* Pending */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Pending — Haven&apos;t responded ({pending.length})
            </CardTitle>
            {pending.length > 0 && (
              <CardDescription>
                Use &quot;Copy Pending Names&quot; above to nudge them in WhatsApp.
              </CardDescription>
            )}
          </CardHeader>
          {pending.length > 0 && (
            <CardContent className="divide-y">
              {pending.map((s) => (
                <StudentRow key={s.userId} student={s} isCoordinator={isCoordinator} />
              ))}
            </CardContent>
          )}
          {pending.length === 0 && (
            <CardContent>
              <p className="text-muted-foreground text-sm">
                All eligible students have responded.
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      <Separator />
      <p className="text-muted-foreground text-center text-xs">
        Share the student link:{" "}
        <code className="bg-muted rounded px-1">
          /placement/drive/{drive.id}
        </code>
      </p>
    </div>
  );
}
