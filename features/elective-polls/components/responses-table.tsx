"use client";

import { useMemo, useState } from "react";

import { Download, Search } from "lucide-react";
import { toast } from "sonner";

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

export interface PollResponseRow {
  id: string;
  email: string;
  userName: string | null;
  studentUsn: string | null;
  studentName: string | null;
  studentBatch: string | null;
  studentSection: string | null;
  optionLabel: string;
  submittedAt: string;
}

interface ResponsesTableProps {
  title: string;
  responses: PollResponseRow[];
  options: { id: string; label: string }[];
  loading: boolean;
}

export function ResponsesTable({
  title,
  responses,
  options,
  loading,
}: ResponsesTableProps) {
  const [search, setSearch] = useState("");
  const [optionFilter, setOptionFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  const sections = useMemo(
    () =>
      [
        ...new Set(responses.map((r) => r.studentSection).filter(Boolean)),
      ].sort() as string[],
    [responses],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return responses.filter((r) => {
      if (optionFilter !== "all" && r.optionLabel !== optionFilter)
        return false;
      if (sectionFilter !== "all" && r.studentSection !== sectionFilter)
        return false;
      if (!q) return true;
      const haystack =
        `${r.studentName ?? r.userName ?? ""} ${r.studentUsn ?? ""} ${r.email}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [responses, search, optionFilter, sectionFilter]);

  function exportCSV() {
    const headers = [
      "Email",
      "Name",
      "USN",
      "Batch",
      "Section",
      "Option",
      "Submitted At",
    ];
    const rows = filtered.map((r) => [
      r.email,
      r.studentName ?? r.userName ?? "",
      r.studentUsn ?? "",
      r.studentBatch ?? "",
      r.studentSection ?? "",
      r.optionLabel,
      new Date(r.submittedAt).toLocaleString("en-IN"),
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.slice(0, 30)}-responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-sm font-medium">
          Responses{" "}
          <span className="text-muted-foreground font-normal">
            ({filtered.length}/{responses.length})
          </span>
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={exportCSV}
          disabled={filtered.length === 0}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 px-0 pb-0">
        {responses.length > 0 && (
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
            <Select value={optionFilter} onValueChange={setOptionFilter}>
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue placeholder="All options" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All options</SelectItem>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.label}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Loading…
          </p>
        ) : responses.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No responses yet.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No responses match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>USN</TableHead>
                  <TableHead>Batch / Section</TableHead>
                  <TableHead>Chose</TableHead>
                  <TableHead>Submitted at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      {r.studentName ?? r.userName ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.email}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.studentUsn ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.studentBatch
                        ? `${r.studentBatch}${r.studentSection ? ` / ${r.studentSection}` : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {r.optionLabel}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(r.submittedAt).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
