"use client";

import { useRef, useState } from "react";

import { Database, Edit, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyAddCard } from "@/components/common/empty-add-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { User } from "@/types";

import { ProfileWithUser } from "../lib/types";
import { ProfileDialog } from "./profile-dialog";

type UserOption = Pick<User, "id" | "name" | "email">;

interface ProfilesManagerProps {
  initialProfiles: ProfileWithUser[];
  users: UserOption[];
}

export function ProfilesManager({ initialProfiles, users }: ProfilesManagerProps) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<ProfileWithUser | null>(null);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleEdit(profile: ProfileWithUser) {
    setEditProfile(profile);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditProfile(null);
    setDialogOpen(true);
  }

  async function handleSuccess() {
    const res = await fetch("/api/placement/profiles");
    if (res.ok) {
      const fresh = await res.json();
      setProfiles(fresh);
    }
  }

  async function handleSyncFromRecords() {
    setSyncing(true);
    try {
      const res = await fetch("/api/placement/academic/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      toast.success(data.message ?? "Sync complete.");
      await handleSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/placement/profiles/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      toast.success(data.message ?? "Profiles uploaded.");
      await handleSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const usersWithoutProfile = users.filter(
    (u) => !profiles.some((p) => p.userId === u.id),
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-muted-foreground text-sm">
          {profiles.length} profile{profiles.length !== 1 ? "s" : ""} configured
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCsvUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncFromRecords}
            disabled={syncing}
            title="Auto-link profiles for registered students with BMSCE emails"
          >
            <Database className="mr-1.5 h-4 w-4" />
            {syncing ? "Syncing..." : "Sync from Records"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {uploading ? "Uploading..." : "Bulk CSV Upload"}
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Profile
          </Button>
        </div>
      </div>

      {/* CSV format hints */}
      <p className="text-muted-foreground text-xs">
        <strong>Academic CSV (recommended):</strong>{" "}
        <code className="bg-muted rounded px-1 text-xs">
          Name, USN, TenthPercent, TwelthPercent, MCA_CGPA
        </code>
        {" "}— seeds records &amp; auto-links registered students.
      </p>

      {profiles.length === 0 ? (
        <EmptyAddCard
          title="Add Profile"
          description="Add profiles manually or upload a CSV to enable eligibility checks."
          onClick={handleAdd}
        />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Student Profiles ({profiles.length})
            </CardTitle>
            <CardDescription>
              Academic and eligibility data used for all placement drives.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>10th %</TableHead>
                  <TableHead>12th %</TableHead>
                  <TableHead>Degree</TableHead>
                  <TableHead>Deg. CGPA</TableHead>
                  <TableHead>MCA CGPA</TableHead>
                  <TableHead>Backlogs</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {profile.user.name ?? "Unnamed"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {profile.user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {profile.tenthPercent?.toFixed(1) ?? "—"}%
                    </TableCell>
                    <TableCell className="text-sm">
                      {profile.twelthPercent?.toFixed(1) ?? "—"}%
                    </TableCell>
                    <TableCell className="text-sm">
                      {profile.degreeType ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {profile.degreeCgpa?.toFixed(2) ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {profile.pgCgpa.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {profile.backlogCount}
                      {profile.hasBacklog && (
                        <Badge variant="destructive" className="ml-1.5 text-xs">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{profile.gender ?? "—"}</TableCell>
                    <TableCell className="text-sm">{profile.category ?? "—"}</TableCell>
                    <TableCell>
                      {profile.isPlacementEligible ? (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                          Eligible
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Blocked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(profile)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ProfileDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editProfile={editProfile}
        users={usersWithoutProfile}
        onSuccess={handleSuccess}
      />
    </>
  );
}
