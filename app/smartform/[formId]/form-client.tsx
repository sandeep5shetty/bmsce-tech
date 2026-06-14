"use client";

import { useState } from "react";

import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import type { SmartFormField, SmartFormSchema } from "@/actions/smartform";

type AnswerValue = string | string[];

export function SmartFormFill({
  formId,
  schema,
}: {
  formId: string;
  schema: SmartFormSchema;
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
    if (current.includes(option)) {
      setValue(fieldId, current.filter((v) => v !== option));
    } else {
      setValue(fieldId, [...current, option]);
    }
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
      if (empty) {
        newErrors[field.id] = `${field.label} is required`;
      }
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
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {schema.fields.map((field) => (
        <FieldInput
          key={field.id}
          field={field}
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

function FieldInput({
  field,
  value,
  error,
  onChange,
  onCheckboxToggle,
}: {
  field: SmartFormField;
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
        {(field.minLabel || field.maxLabel) && (
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>{field.minLabel}</span>
            <span>{field.maxLabel}</span>
          </div>
        )}
      </div>
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
