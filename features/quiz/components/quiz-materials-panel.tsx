"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface QuizMaterialSummary {
  id: string;
  file_name: string;
  status: string;
  error: string | null;
  chunk_count: number;
  created_at: string;
}

interface QuizMaterialsPanelProps {
  eventId: string;
  /** When shown inside a dialog, adjust layout for the close control. */
  inDialog?: boolean;
  onMaterialsChange?: (materials: QuizMaterialSummary[]) => void;
}

function statusBadge(status: string) {
  switch (status) {
    case "ready":
      return <Badge className="bg-emerald-600/15 text-emerald-700">Ready</Badge>;
    case "indexing":
    case "pending":
      return <Badge variant="secondary">Indexing…</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function QuizMaterialsPanel({
  eventId,
  inDialog = false,
  onMaterialsChange,
}: QuizMaterialsPanelProps) {
  const [materials, setMaterials] = useState<QuizMaterialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadMaterials = useCallback(async () => {
    try {
      const res = await fetch(`/api/quiz/v1/events/${eventId}/materials`);
      const data = (await res.json()) as {
        materials?: QuizMaterialSummary[];
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(data.error?.message ?? "Could not load materials.");
      }
      const list = data.materials ?? [];
      setMaterials(list);
      onMaterialsChange?.(list);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not load materials.",
      );
    } finally {
      setLoading(false);
    }
  }, [eventId, onMaterialsChange]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/quiz/v1/events/${eventId}/materials`, {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as {
          material?: QuizMaterialSummary;
          error?: { message?: string };
        };
        if (!res.ok) {
          throw new Error(data.error?.message ?? "Upload failed.");
        }
        toast.success("Material uploaded and indexed.");
        await loadMaterials();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [eventId, loadMaterials],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: uploading,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
    },
  });

  async function handleDelete(materialId: string) {
    try {
      const res = await fetch(
        `/api/quiz/v1/events/${eventId}/materials/${materialId}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(data.error?.message ?? "Delete failed.");
      }
      toast.success("Material removed.");
      await loadMaterials();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  async function handleRetry(materialId: string) {
    try {
      const res = await fetch(
        `/api/quiz/v1/events/${eventId}/materials/${materialId}`,
        { method: "POST" },
      );
      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(data.error?.message ?? "Re-index failed.");
      }
      toast.success("Material re-indexed.");
      await loadMaterials();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Re-index failed.");
    }
  }

  const readyCount = materials.filter((m) => m.status === "ready").length;

  return (
    <Card
      className={
        inDialog ? "border-0 shadow-none rounded-none sm:rounded-lg" : undefined
      }
    >
      <CardHeader className={inDialog ? "pb-3 pr-10" : "pb-3"}>
        <CardTitle className="flex items-center gap-2 font-serif text-base">
          <FileText className="h-4 w-4" />
          Course materials
          {readyCount > 0 && (
            <Badge variant="secondary" className="font-normal">
              {readyCount} indexed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Upload PDF, DOCX, or PPTX files. AI question generation can ground
          answers in these sources with citations.
        </p>

        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
          )}
          <p className="text-muted-foreground mt-2 text-xs">
            Drop a file or click to upload (max 25 MB)
          </p>
        </div>

        {loading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading materials…
          </div>
        ) : materials.length === 0 ? (
          <p className="text-muted-foreground text-sm">No materials yet.</p>
        ) : (
          <ul className="space-y-2">
            {materials.map((material) => (
              <li
                key={material.id}
                className="flex items-start justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {material.file_name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {statusBadge(material.status)}
                    {material.status === "ready" && (
                      <span className="text-muted-foreground text-xs">
                        {material.chunk_count} chunks
                      </span>
                    )}
                  </div>
                  {material.error && (
                    <p className="text-destructive mt-1 text-xs">
                      {material.error}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {material.status === "failed" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void handleRetry(material.id)}
                      aria-label="Retry indexing"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void handleDelete(material.id)}
                    aria-label="Delete material"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
