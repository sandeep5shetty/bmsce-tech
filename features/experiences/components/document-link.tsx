import { FileText, FileType } from "lucide-react";

import { DocumentType } from "../lib/validation";

/**
 * "2.4 MB" / "340 KB" hint for a stored document. Lives here (not in the
 * upload dropzone) because that file is "use client" — importing from it in a
 * server component turns this into a client reference that throws when called
 * during server render.
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Routes a stored document through the app's download endpoint so the file
 * arrives named the way its author uploaded it — the raw S3 key is a UUID.
 */
export function documentHref(url: string, fileName?: string | null): string {
  const params = new URLSearchParams({ url });
  if (fileName) params.set("name", fileName);
  return `/api/experiences/v1/documents?${params.toString()}`;
}

const meta = {
  pdf: {
    icon: FileText,
    label: "PDF",
    classes: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
  docx: {
    icon: FileType,
    label: "DOCX",
    classes: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
} as const;

/** Icon, label and badge colours for a document type, with a PDF fallback. */
export function documentMeta(type: DocumentType | string) {
  return type === "docx" ? meta.docx : meta.pdf;
}
