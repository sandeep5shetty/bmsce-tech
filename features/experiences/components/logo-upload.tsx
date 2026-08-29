"use client";

import { useCallback, useState } from "react";

import Image from "next/image";

import { ImageIcon, Loader2, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Square company-logo dropzone. Sits beside the company name in the form and
 * previews the uploaded logo at the same size the cards render it.
 */
export function LogoUpload({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
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

        const res = await fetch("/api/experiences/v1/uploads/logo", {
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
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
      "image/svg+xml": [".svg"],
    },
    maxFiles: 1,
    disabled: disabled || uploading,
  });

  if (value) {
    return (
      <div className="bg-card relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border">
        <Image
          src={value}
          alt="Company logo"
          fill
          sizes="64px"
          className="object-contain p-1"
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-5 w-5"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label="Remove logo"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`flex h-16 w-16 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      } ${disabled || uploading ? "pointer-events-none opacity-60" : ""}`}
      title="Upload company logo"
    >
      <input {...getInputProps()} />
      {uploading ? (
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
      ) : (
        <>
          <ImageIcon className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground mt-1 text-[10px]">Logo</span>
        </>
      )}
    </div>
  );
}
