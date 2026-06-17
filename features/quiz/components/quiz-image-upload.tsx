"use client";

import { useCallback, useState } from "react";

import { ImageIcon, Loader2, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { resolveQuizMediaSrc } from "@/lib/s3/storage";

interface QuizImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  description?: string;
  variant?: "default" | "logo";
}

export function QuizImageUpload({
  value,
  onChange,
  label = "Image",
  description = "JPEG, PNG, GIF, or WebP up to 4 MB.",
  variant = "default",
}: QuizImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/quiz/v1/uploads/image", {
          method: "POST",
          body: formData,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data?.error?.message ?? "Upload failed.");
          return;
        }

        if (data.url) onChange(data.url);
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
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {value ? (
        <div
          className={
            variant === "logo"
              ? "relative inline-block h-32 w-32 overflow-hidden rounded-xl border"
              : "relative inline-block"
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveQuizMediaSrc(value) || value}
            alt=""
            className={
              variant === "logo"
                ? "h-32 w-32 rounded-xl object-cover"
                : "h-24 w-24 rounded-lg border object-cover"
            }
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={() => onChange(null)}
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <ImageIcon className="mx-auto h-6 w-6 text-muted-foreground" />
          )}
          <p className="text-muted-foreground mt-2 text-xs">
            Drop an image or click to upload
          </p>
        </div>
      )}
    </div>
  );
}
