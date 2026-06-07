"use client";

import { useState } from "react";

import { CheckCircle2, Link2, XCircle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { linkRecordToUser } from "../lib/actions";
import { StudentCombobox } from "./student-combobox";

type AcademicRecord = {
  id: string;
  usn: string;
  name: string;
  batch: string;
  tenthPercent: number;
  twelthPercent: number;
  pgCgpa: number | null;
  degreeType: string | null;
  linked: boolean;
};

type UserOption = { id: string; name: string | null; email: string };

interface Props {
  records: AcademicRecord[];
  users: UserOption[];
}

export function AcademicRecordsSection({ records, users }: Props) {
  const [filter, setFilter] = useState("");
  const [showLinked, setShowLinked] = useState(false);
  const [linkingRecord, setLinkingRecord] = useState<AcademicRecord | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = records.filter((r) => {
    if (!showLinked && r.linked) return false;
    if (filter) {
      const q = filter.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.usn.toLowerCase().includes(q);
    }
    return true;
  });

  const linkedCount = records.filter((r) => r.linked).length;
  const unlinkedCount = records.length - linkedCount;

  async function handleLink() {
    if (!linkingRecord || !selectedUserId) return;
    setSaving(true);
    try {
      await linkRecordToUser(linkingRecord.usn, selectedUserId);
      toast.success(`Linked ${linkingRecord.name} successfully.`);
      setLinkingRecord(null);
      setSelectedUserId("");
      // Refresh by reloading page data
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to link");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">Academic Records ({records.length})</CardTitle>
              <CardDescription>
                Data from official batch list. Link each record to a registered user account.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600 dark:text-green-400">
                <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
                {linkedCount} linked
              </span>
              <span className="text-muted-foreground">
                <XCircle className="inline h-3.5 w-3.5 mr-1" />
                {unlinkedCount} pending
              </span>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Input
              placeholder="Search by name or USN..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-xs h-8 text-sm"
            />
            <Button
              variant={showLinked ? "default" : "outline"}
              size="sm"
              onClick={() => setShowLinked((v) => !v)}
            >
              {showLinked ? "Hide linked" : "Show all"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>USN</TableHead>
                <TableHead>10th %</TableHead>
                <TableHead>12th %</TableHead>
                <TableHead>MCA CGPA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-6 text-center text-sm">
                    {filter ? "No records match your search." : "All records are linked."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((record) => (
                <TableRow key={record.usn} className={record.linked ? "opacity-50" : undefined}>
                  <TableCell className="text-sm font-medium">{record.name}</TableCell>
                  <TableCell className="font-mono text-xs">{record.usn}</TableCell>
                  <TableCell className="text-sm">{record.tenthPercent.toFixed(1)}%</TableCell>
                  <TableCell className="text-sm">{record.twelthPercent.toFixed(1)}%</TableCell>
                  <TableCell className="text-sm">
                    {record.pgCgpa !== null ? (
                      <span className="font-medium">{record.pgCgpa.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.linked ? (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                        Linked
                      </Badge>
                    ) : record.pgCgpa === null ? (
                      <Badge variant="secondary" className="text-xs">
                        No CGPA
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!record.linked && record.pgCgpa !== null && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setLinkingRecord(record);
                          setSelectedUserId("");
                        }}
                      >
                        <Link2 className="mr-1 h-3 w-3" />
                        Link
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Link dialog */}
      <Dialog open={!!linkingRecord} onOpenChange={(o) => { if (!o) setLinkingRecord(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Link to Registered User</DialogTitle>
            <DialogDescription>
              Select the user account for <strong>{linkingRecord?.name}</strong> ({linkingRecord?.usn}).
              Their academic data will be imported automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <StudentCombobox
              users={users}
              value={selectedUserId}
              onChange={setSelectedUserId}
              disabled={saving}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLinkingRecord(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleLink}
                disabled={saving || !selectedUserId}
              >
                {saving ? "Linking..." : "Link & Create Profile"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
