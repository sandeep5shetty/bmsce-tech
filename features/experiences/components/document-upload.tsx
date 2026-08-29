"use client";

import { useCallback, useState } from "react";

import { FileText, Loader2, Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { DocumentType } from "../lib/validation";
import { formatFileSize } from "./document-link";

export type UploadedDocument = {
  url: string;
  type: DocumentType;
  fileName: string;
  fileSize: number;
};

const documentTypeLabel: Record<DocumentType, string> = {
  pdf: "PDF",
  docx: "DOCX",
};

/**
 * Shared PDF/DOCX dropzone for the JD field and each extra resource. Uploads
 * straight to S3 through the experiences upload route and hands the parent the
 * stored URL plus the original filename and size.
 */
export function DocumentUpload({
  value,
  onChange,
  disabled,
  compact = false,
}: {
  value: UploadedDocument | null;
  onChange: (document: UploadedDocument | null) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/experiences/v1/uploads/document", {
          method: "POST",
          body: formData,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data?.error?.message ?? "Upload failed.");
          return;
        }

        if (data.url) {
          onChange({
            url: data.url,
            type: data.type,
            fileName: data.fileName,
            fileSize: data.fileSize,
          });
        }
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
    disabled: disabled || uploading,
  });

  if (value) {
    return (
      <div className="bg-muted/40 flex items-center gap-3 rounded-lg border p-3">
        <div className="bg-primary/15 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.fileName}</p>
          <p className="text-muted-foreground text-xs">
            {documentTypeLabel[value.type]}
            {value.fileSize ? ` · ${formatFileSize(value.fileSize)}` : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label="Remove file"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-lg border-2 border-dashed text-center transition-colors ${
        compact ? "p-4" : "p-6"
      } ${
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      } ${disabled || uploading ? "pointer-events-none opacity-60" : ""}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <Loader2 className="text-muted-foreground mx-auto h-5 w-5 animate-spin" />
      ) : (
        <Upload className="text-muted-foreground mx-auto h-5 w-5" />
      )}
      <p className="text-muted-foreground mt-2 text-xs">
        {uploading ? "Uploading..." : "Drop a PDF or DOCX, or click to upload"}
      </p>
      {!uploading && !compact && (
        <p className="text-muted-foreground mt-0.5 text-xs">Up to 10 MB</p>
      )}
    </div>
  );
}
