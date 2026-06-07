import Link from "next/link";

import { Calendar, ChevronRight, Shield, Users } from "lucide-react";

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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

import { CoordinatorSetup } from "@/features/placement/components/coordinator-setup";
import { getAllDrives, tryAutoSeedProfile } from "@/features/placement/lib/actions";

export default async function PlacementPage() {
  const [drives, isCoordinator] = await Promise.all([
    getAllDrives(),
    getIsCoordinator(),
  ]);

  // Silently create placement profile for students who haven't been seeded yet
  if (!isCoordinator) {
    await tryAutoSeedProfile();
  }

  return (
    <div className="container mx-auto mt-8 mb-32 max-w-6xl space-y-8 px-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-semibold">Placement Pulse</h1>
            {isCoordinator && (
              <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                <Shield className="mr-1 h-3 w-3" />
                Coordinator
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Track company drives and Superset registrations.
          </p>
        </div>
        {isCoordinator && (
          <div className="flex gap-2">
            <Button variant="outline" asChild size="sm">
              <Link href="/placement/profiles">
                <Users className="mr-1 h-3.5 w-3.5" />
                Student Profiles
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/placement/create">Create Drive</Link>
            </Button>
          </div>
        )}
      </div>

      {drives.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No drives yet</EmptyTitle>
            <EmptyDescription>
              {isCoordinator
                ? "Create your first placement drive to get started."
                : "No drives are active right now. Check back later."}
            </EmptyDescription>
          </EmptyHeader>
          {isCoordinator && (
            <Button asChild>
              <Link href="/placement/create">Create Drive</Link>
            </Button>
          )}
        </Empty>
      ) : (
        <div className="grid gap-4">
          {drives.map((drive) => {
            const isExpired = new Date() > new Date(drive.deadline);
            const isActive = !drive.isLocked && !isExpired;
            const cardContent = (
              <Card
                key={drive.id}
                className={`transition-shadow hover:shadow-md${!isCoordinator && isActive ? " cursor-pointer" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{drive.title}</CardTitle>
                      {drive.description && (
                        <CardDescription className="line-clamp-2">
                          {drive.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {drive.isLocked && (
                        <Badge variant="secondary">Locked</Badge>
                      )}
                      {isExpired && !drive.isLocked && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                      {!isExpired && !drive.isLocked && (
                        <Badge className="bg-green-500 text-white hover:bg-green-600">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(drive.deadline).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {drive.responseCount} response
                        {drive.responseCount !== 1 ? "s" : ""}
                      </span>
                      <span>Min MCA CGPA: {drive.minPgCgpa.toFixed(1)}</span>
                      {drive.allowBacklog && <span>Backlog OK</span>}
                    </div>
                    {isCoordinator ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/placement/dashboard/${drive.id}`}>
                          View Dashboard
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : isActive ? (
                      <Button asChild size="sm">
                        <Link href={`/placement/drive/${drive.id}`}>
                          Register / Respond
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
            return cardContent;
          })}
        </div>
      )}

      {!isCoordinator && <CoordinatorSetup />}
    </div>
  );
}
