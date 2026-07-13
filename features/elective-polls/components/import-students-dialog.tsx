"use client";

import { useRef, useState } from "react";

import * as XLSX from "xlsx";

import { AlertCircle, CheckCircle2, FileSpreadsheet, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { createStudentSchema } from "@/features/elective-polls/lib/validation";

interface ImportStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedRow {
  raw: Record<string, unknown>;
  data: { name: string; usn: string; email: string; batch: string; section: string } | null;
  error: string | null;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// Loosely maps arbitrary spreadsheet header text to our five canonical
// fields, so admins don't have to match column names exactly (e.g. "Email
// Id" and "E-Mail" both resolve to "email").
const HEADER_ALIASES: Record<string, "name" | "usn" | "email" | "batch" | "section"> = {
  name: "name",
  studentname: "name",
  usn: "usn",
  email: "email",
  emailid: "email",
  emailaddress: "email",
  batch: "batch",
  section: "section",
  sec: "section",
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z]/g, "");
}

function parseWorkbook(buffer: ArrayBuffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return rawRows.map((raw) => {
    const mapped: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      const field = HEADER_ALIASES[normalizeHeader(key)];
      if (field) mapped[field] = String(value ?? "").trim();
    }

    const parsed = createStudentSchema.safeParse(mapped);
    if (!parsed.success) {
      return {
        raw,
        data: null,
        error: parsed.error.issues[0]?.message ?? "Invalid row.",
      };
    }
    return { raw, data: parsed.data, error: null };
  });
}

export function ImportStudentsDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportStudentsDialogProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows = (rows ?? []).filter((r) => r.data);
  const invalidCount = (rows ?? []).length - validRows.length;

  function reset() {
    setFileName(null);
    setRows(null);
    setParseError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setParseError(null);
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseWorkbook(buffer);
      if (parsed.length === 0) {
        setParseError("No rows found in this file.");
        setRows(null);
        return;
      }
      setRows(parsed);
    } catch {
      setParseError(
        "Couldn't read this file. Make sure it's a valid .csv or .xlsx file.",
      );
      setRows(null);
    }
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/elective-polls/v1/roster/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows.map((r) => r.data) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to import students");
      }
      setResult(body);
      if (body.imported > 0) {
        toast.success(
          `Imported ${body.imported} student${body.imported === 1 ? "" : "s"}`,
        );
        onSuccess();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import students",
      );
    } finally {
      setImporting(false);
    }
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to add many students at once. The
            first row must be column headers:{" "}
            <code className="bg-muted rounded px-1 text-xs">
              Name, USN, Email, Batch, Section
            </code>
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFile}
        />

        {!rows ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40 flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors"
          >
            <FileSpreadsheet className="text-muted-foreground h-8 w-8" />
            <p className="text-sm font-medium">
              Click to choose a .csv or .xlsx file
            </p>
            <p className="text-muted-foreground text-xs">
              {fileName ?? "No file selected"}
            </p>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="truncate text-sm font-medium">{fileName}</p>
              <button
                type="button"
                onClick={reset}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs underline-offset-2 hover:underline"
              >
                <X className="h-3 w-3" />
                Choose a different file
              </button>
            </div>

            <div className="max-h-64 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Name</TableHead>
                    <TableHead>USN</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Batch / Section</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        {r.data ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <AlertCircle
                            className="text-destructive h-3.5 w-3.5"
                            aria-label={r.error ?? "Invalid row"}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.data?.name || String(r.raw.name ?? r.raw.Name ?? "—")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.data?.usn || String(r.raw.usn ?? r.raw.USN ?? "—")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.data?.email ||
                          String(r.raw.email ?? r.raw.Email ?? "—")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.data ? (
                          `${r.data.batch} / ${r.data.section}`
                        ) : (
                          <span className="text-destructive">{r.error}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="text-muted-foreground text-xs">
              {validRows.length} valid
              {invalidCount > 0 && `, ${invalidCount} will be skipped`}
            </p>
          </div>
        )}

        {parseError && (
          <div className="border-destructive/20 bg-destructive/10 rounded-lg border p-3">
            <p className="text-destructive text-sm">{parseError}</p>
          </div>
        )}

        {result && (
          <div className="space-y-1.5 rounded-lg border p-3 text-sm">
            <p className="font-medium">
              {result.imported} imported
              {result.skipped > 0 && `, ${result.skipped} skipped`}.
            </p>
            {result.errors.length > 0 && (
              <ul className="text-muted-foreground max-h-32 list-disc space-y-0.5 overflow-auto pl-4 text-xs">
                {result.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={importing}
          >
            {result ? "Close" : "Cancel"}
          </Button>
          {rows && !result && (
            <Button
              type="button"
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
            >
              {importing && <Spinner size="sm" />}
              Import {validRows.length} Student
              {validRows.length === 1 ? "" : "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
