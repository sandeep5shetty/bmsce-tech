"use client";

import { useEffect, useMemo, useState } from "react";

import { Edit, Loader2, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { EmptyAddCard } from "@/components/common/empty-add-card";

import { ConfirmActionDialog } from "@/features/quiz/components/confirm-action-dialog";

import type { RosterStudentWithUsage } from "@/features/elective-polls/lib/roster-actions";

import { ImportStudentsDialog } from "./import-students-dialog";
import { StudentDialog } from "./student-dialog";

export function StudentsManager() {
  const [students, setStudents] = useState<RosterStudentWithUsage[] | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [usageFilter, setUsageFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editStudent, setEditStudent] =
    useState<RosterStudentWithUsage | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<RosterStudentWithUsage | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const res = await fetch("/api/elective-polls/v1/roster");
    if (res.ok) {
      const body = await res.json();
      setStudents(body.students ?? []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const batches = useMemo(
    () =>
      students
        ? [...new Set(students.map((s) => s.batch))].sort()
        : [],
    [students],
  );
  const sections = useMemo(
    () =>
      students
        ? [...new Set(students.map((s) => s.section))].sort()
        : [],
    [students],
  );
  const hasUsedStudents = useMemo(
    () => (students ?? []).some((s) => s.usageCount > 0),
    [students],
  );
  const hasUnusedStudents = useMemo(
    () => (students ?? []).some((s) => s.usageCount === 0),
    [students],
  );

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (batchFilter !== "all" && s.batch !== batchFilter) return false;
      if (sectionFilter !== "all" && s.section !== sectionFilter) return false;
      if (usageFilter === "in-use" && s.usageCount === 0) return false;
      if (usageFilter === "unused" && s.usageCount > 0) return false;
      if (!q) return true;
      return `${s.name} ${s.usn} ${s.email}`.toLowerCase().includes(q);
    });
  }, [students, search, batchFilter, sectionFilter, usageFilter]);

  function handleAdd() {
    setEditStudent(null);
    setDialogOpen(true);
  }

  function handleEdit(s: RosterStudentWithUsage) {
    setEditStudent(s);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/elective-polls/v1/roster/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to delete student");
      }
      toast.success(`"${deleteTarget.name}" removed from the roster`);
      setDeleteTarget(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete student",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editStudent={editStudent}
        existingBatches={batches}
        onSuccess={load}
      />
      <ImportStudentsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={load}
      />
      <ConfirmActionDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Remove "${deleteTarget?.name}"?`}
        description={
          deleteTarget && deleteTarget.usageCount > 0
            ? `This student is referenced in ${deleteTarget.usageCount} poll's custom audience list${deleteTarget.usageCount === 1 ? "" : "s"} — deleting them will remove them from ${deleteTarget.usageCount === 1 ? "that poll's" : "those polls'"} audience too. This can't be undone.`
            : "This will permanently remove this student from the roster. This can't be undone."
        }
        confirmLabel="Remove Student"
        onConfirm={handleDelete}
        loading={deleting}
        destructive
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">
            Manage Students
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Add, edit, or remove students from the roster used for elective
            poll audience targeting.
          </p>
        </div>
        {students && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Import
            </Button>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Student
            </Button>
          </div>
        )}
      </div>

      {students === null ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <EmptyAddCard
          title="Add Student"
          description="Add your first student to the roster, or import many at once."
          onClick={handleAdd}
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setImportOpen(true);
              }}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Import from CSV/Excel
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Roster
              <span className="text-muted-foreground font-normal">
                {" "}
                ({filtered.length}/{students.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-0 pb-0">
            <div className="flex flex-wrap items-center gap-2 px-6">
              <div className="relative min-w-48 flex-1">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                <Input
                  placeholder="Search name, USN, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
              {batches.length > 1 && (
                <Select value={batchFilter} onValueChange={setBatchFilter}>
                  <SelectTrigger className="h-8 w-40 text-sm">
                    <SelectValue placeholder="All batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All batches</SelectItem>
                    {batches.map((b) => (
                      <SelectItem key={b} value={b}>
                        Batch {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {sections.length > 1 && (
                <Select value={sectionFilter} onValueChange={setSectionFilter}>
                  <SelectTrigger className="h-8 w-36 text-sm">
                    <SelectValue placeholder="All sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sections</SelectItem>
                    {sections.map((s) => (
                      <SelectItem key={s} value={s}>
                        Section {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {hasUsedStudents && hasUnusedStudents && (
                <Select value={usageFilter} onValueChange={setUsageFilter}>
                  <SelectTrigger className="h-8 w-40 text-sm">
                    <SelectValue placeholder="All students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All students</SelectItem>
                    <SelectItem value="in-use">In a poll</SelectItem>
                    <SelectItem value="unused">Not in any poll</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {filtered.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No students match your filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>USN</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Batch / Section</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">{s.name}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.usn}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.email}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.batch} / {s.section}
                          {s.usageCount > 0 && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              in {s.usageCount} poll
                              {s.usageCount === 1 ? "" : "s"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(s)}
                              aria-label={`Edit ${s.name}`}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(s)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label={`Remove ${s.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
