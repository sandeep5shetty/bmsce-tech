"use client";

import { useCallback, useState } from "react";

import Link from "next/link";

import { useDropzone } from "react-dropzone";
import { CheckCircle, ExternalLink, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import type { SmartFormField, SmartFormSchema } from "@/actions/smartform";

type AnswerValue = string | string[];

export function SmartFormFill({
  formId,
  schema,
  userEmail,
}: {
  formId: string;
  schema: SmartFormSchema;
  userEmail: string;
}) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setValue(fieldId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }

  function toggleCheckbox(fieldId: string, option: string) {
    const current = (answers[fieldId] as string[] | undefined) ?? [];
    setValue(
      fieldId,
      current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option],
    );
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const field of schema.fields) {
      if (!field.required) continue;
      const val = answers[field.id];
      const empty =
        val === undefined ||
        val === "" ||
        (Array.isArray(val) && val.length === 0);
      if (empty) newErrors[field.id] = `${field.label} is required`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/smartform/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Submission failed");
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle className="text-primary size-12" />
        <h2 className="text-xl font-semibold">Response submitted!</h2>
        <p className="text-muted-foreground text-sm">
          Thank you for filling out this form.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/smartform/submissions">View my submissions</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Auto-captured email — shown read-only */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Email <span className="text-destructive">*</span>
        </label>
        <input
          type="email"
          value={userEmail}
          readOnly
          className="border-input bg-muted text-muted-foreground w-full rounded-lg border px-3 py-2 text-sm"
        />
        <p className="text-muted-foreground text-xs">Auto-filled from your account</p>
      </div>

      {schema.fields.map((field) => (
        <FieldInput
          key={field.id}
          field={field}
          formId={formId}
          value={answers[field.id]}
          error={errors[field.id]}
          onChange={(val) => setValue(field.id, val)}
          onCheckboxToggle={(opt) => toggleCheckbox(field.id, opt)}
        />
      ))}

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit"
        )}
      </Button>
    </form>
  );
}

// ─── Individual field renderer ────────────────────────────────────────────────

function FieldInput({
  field,
  formId,
  value,
  error,
  onChange,
  onCheckboxToggle,
}: {
  field: SmartFormField;
  formId: string;
  value?: AnswerValue;
  error?: string;
  onChange: (val: string) => void;
  onCheckboxToggle: (opt: string) => void;
}) {
  const inputClass =
    "border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50";

  const labelEl = (
    <label className="text-sm font-medium" htmlFor={field.id}>
      {field.label}
      {field.required && <span className="text-destructive ml-1">*</span>}
    </label>
  );

  let input: React.ReactNode;

  if (field.type === "textarea") {
    input = (
      <textarea
        id={field.id}
        rows={3}
        placeholder={field.placeholder}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    );
  } else if (field.type === "select") {
    input = (
      <select
        id={field.id}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">Select an option</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "radio") {
    input = (
      <div className="space-y-2">
        {field.options?.map((opt) => (
          <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name={field.id}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="accent-primary"
            />
            {opt}
          </label>
        ))}
      </div>
    );
  } else if (field.type === "checkbox") {
    const selected = (value as string[] | undefined) ?? [];
    input = (
      <div className="space-y-2">
        {field.options?.map((opt) => (
          <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              value={opt}
              checked={selected.includes(opt)}
              onChange={() => onCheckboxToggle(opt)}
              className="accent-primary"
            />
            {opt}
          </label>
        ))}
      </div>
    );
  } else if (field.type === "scale") {
    const min = field.min ?? 1;
    const max = field.max ?? 5;
    const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    input = (
      <div className="space-y-1">
        <div className="flex flex-wrap gap-2">
          {steps.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(String(n))}
              className={`flex size-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                value === String(n)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-input"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {(field.minLabel ?? field.maxLabel) && (
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>{field.minLabel}</span>
            <span>{field.maxLabel}</span>
          </div>
        )}
      </div>
    );
  } else if (field.type === "file") {
    input = (
      <FileUploadField
        fieldId={field.id}
        formId={formId}
        value={(value as string) ?? ""}
        onChange={onChange}
      />
    );
  } else {
    const inputType = ["text", "email", "tel", "number", "date"].includes(field.type)
      ? field.type
      : "text";
    input = (
      <input
        id={field.id}
        type={inputType}
        placeholder={field.placeholder}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    );
  }

  return (
    <div className="space-y-1.5">
      {labelEl}
      {input}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

// ─── File upload field (AWS S3 presigned PUT) ─────────────────────────────────

function FileUploadField({
  fieldId,
  formId,
  value,
  onChange,
}: {
  fieldId: string;
  formId: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      setProgress(0);
      try {
        // 1. Get presigned URL from server
        const metaRes = await fetch("/api/smartform/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
            formId,
          }),
        });
        const meta = await metaRes.json() as { presignedUrl?: string; publicUrl?: string; error?: string };
        if (!metaRes.ok) throw new Error(meta.error ?? "Failed to get upload URL");

        // 2. Upload directly to S3
        setProgress(30);
        const uploadRes = await fetch(meta.presignedUrl!, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!uploadRes.ok) throw new Error("Upload to S3 failed");

        setProgress(100);
        onChange(meta.publicUrl!);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [formId, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: uploading,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    },
  });

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
        <Paperclip className="text-muted-foreground size-4 shrink-0" />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary min-w-0 flex-1 truncate hover:underline"
        >
          <span className="flex items-center gap-1">
            View uploaded file <ExternalLink className="size-3" />
          </span>
        </a>
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Remove file"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      id={fieldId}
      className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      } ${uploading ? "pointer-events-none opacity-60" : ""}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <>
          <Loader2 className="text-muted-foreground mx-auto size-6 animate-spin" />
          {progress > 0 && (
            <div className="bg-muted mx-auto mt-3 h-1.5 w-32 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </>
      ) : (
        <Paperclip className="text-muted-foreground mx-auto size-6" />
      )}
      <p className="text-muted-foreground mt-2 text-xs">
        {uploading ? "Uploading to S3…" : "Drop a PDF or image here, or click to browse (max 16 MB)"}
      </p>
    </div>
  );
}
