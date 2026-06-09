"use client";

import { useCallback, useState } from "react";

import { ImageIcon, Loader2, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useUploadThing } from "@/lib/upload";

interface QuizImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  description?: string;
}

export function QuizImageUpload({
  value,
  onChange,
  label = "Image",
  description = "JPEG, PNG, GIF, or WebP up to 4 MB.",
}: QuizImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { startUpload } = useUploadThing("quizImageUploader", {
    onUploadError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setUploading(true);
      try {
        const res = await startUpload([file]);
        const url = res?.[0]?.ufsUrl;
        if (url) onChange(url);
      } finally {
        setUploading(false);
      }
    },
    [startUpload, onChange],
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
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-24 w-24 rounded-lg border object-cover"
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
