"use client";

import { useEffect, useMemo, useState } from "react";

import { CheckCircle2, Loader2, Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface NonResponder {
  id: string;
  name: string;
  usn: string;
  email: string;
  batch: string;
  section: string | null;
}

export function NonRespondersList({ pollId }: { pollId: string }) {
  const [students, setStudents] = useState<NonResponder[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/elective-polls/v1/polls/${pollId}/non-responders`)
      .then((r) => r.json())
      .then((body) => setStudents(body.students ?? []))
      .catch(() => setStudents([]));
  }, [pollId]);

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      `${s.name} ${s.usn} ${s.email}`.toLowerCase().includes(q),
    );
  }, [students, search]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Not yet responded
          {students && (
            <span className="text-muted-foreground font-normal">
              {" "}
              ({filtered.length}/{students.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0 pb-0">
        {students && students.length > 0 && (
          <div className="px-6">
            <div className="relative max-w-sm">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search name, USN, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>
        )}

        {students === null ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : students.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Everyone in this poll&apos;s audience has responded.
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No students match your search.
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{s.name}</TableCell>
                    <TableCell className="font-mono text-xs">{s.usn}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {s.email}
                    </TableCell>
                    <TableCell className="text-xs">
                      {s.batch}
                      {s.section ? ` / ${s.section}` : ""}
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
