"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  type MySubmission,
  type SmartFormField,
  type SmartFormSummary,
  listMySubmissions,
  listSmartForms,
} from "@/actions/smartform";

const STORAGE_KEY = "smartform_unlocked";

const EXAMPLE_CHIPS = [
  {
    label: "Industrial visit",
    text: "Industrial visit consent – name, USN, branch, t-shirt size, medical conditions, parent contact",
  },
  {
    label: "Internship details",
    text: "Internship details – company, role, stipend, duration, location",
  },
  {
    label: "Mid-sem feedback",
    text: "Mid-semester feedback – subject, teaching quality (scale 1–5), suggestions",
  },
  {
    label: "Project group",
    text: "Project group registration – group name, members (up to 4) with USNs, project title, domain",
  },
  {
    label: "Medical info",
    text: "Medical info for fest – blood group, allergies, emergency contact",
  },
];

const FIELD_TYPES = [
  "text",
  "email",
  "tel",
  "number",
  "date",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "scale",
  "file",
] as const;

type GeneratedSchema = {
  title: string;
  description: string;
  fields: SmartFormField[];
};

type ApiResponse = {
  id: string;
  formId: string;
  answers: Record<string, unknown>;
  submittedBy: string | null;
  submittedAt: string;
};

// ─── Root page (gate) ─────────────────────────────────────────────────────────

export default function SmartFormPage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    setUnlocked(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (unlocked === null) return null;

  if (unlocked) return <SmartFormDashboard />;

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/smartform/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error((data as { error?: string }).error ?? "Invalid code");
      } else {
        localStorage.setItem(STORAGE_KEY, "true");
        setUnlocked(true);
      }
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="from-primary/25 pointer-events-none absolute -top-32 -right-16 h-96 w-96 rounded-full bg-linear-to-br to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-linear-to-br from-violet-500/20 to-transparent blur-3xl" />

        <div className="relative container mx-auto max-w-4xl px-4 pt-12 pb-8">
          <span className="text-primary bg-primary/10 mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered
          </span>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl leading-[1.05] font-normal">
                Describe a form, get it in seconds.
              </h1>
              <p className="text-muted-foreground mt-3 max-w-lg text-base">
                AI-powered forms for your class. Fill forms shared by your
                coordinator, and track everything you&apos;ve submitted.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCodeEntry((v) => !v)}
              className="shrink-0"
            >
              <ShieldCheck className="size-4" />
              Admin Access
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 pb-8">
      {showCodeEntry && (
        <Card className="mb-6 max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="text-primary size-4" />
              Admin Login
            </CardTitle>
            <CardDescription>
              Enter the admin code to manage forms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="admin-code">Admin Code</Label>
                <Input
                  id="admin-code"
                  type="password"
                  placeholder="Enter code…"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={verifying}
                  autoComplete="off"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={verifying || !code.trim()}
              >
                {verifying ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Unlock"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <MySubmissionsList />
      </div>
    </div>
  );
}

// ─── Student submissions list (shown on /smartform for non-coordinators) ───────

function MySubmissionsList() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: listMySubmissions,
    staleTime: 1000 * 30,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">My Submissions</h2>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-xl border py-16 text-center text-sm">
          <ClipboardList className="size-10 opacity-30" />
          <p>You haven&apos;t submitted any forms yet.</p>
        </div>
      )}

      {data?.map((submission) => (
        <MySubmissionCard key={submission.id} submission={submission} />
      ))}
    </div>
  );
}

function MySubmissionCard({ submission }: { submission: MySubmission }) {
  const [expanded, setExpanded] = useState(false);
  const fields = submission.formSchema.fields;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{submission.formTitle}</CardTitle>
            <p className="text-muted-foreground mt-1 text-xs">
              Submitted {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setExpanded((v) => !v)}>
            {expanded ? (
              <><ChevronUp className="size-3.5" />Hide</>
            ) : (
              <><ChevronDown className="size-3.5" />View Response</>
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="rounded-lg border">
            <div className="bg-muted/50 border-b px-4 py-2">
              <p className="text-xs font-medium">Your Answers</p>
            </div>
            <div className="divide-y">
              {fields.map((field) => {
                const raw = submission.answers[field.id];
                const value = Array.isArray(raw) ? raw.join(", ") : String(raw ?? "—");
                const isFileUrl =
                  typeof raw === "string" &&
                  (raw.startsWith("http://") || raw.startsWith("https://"));
                return (
                  <div key={field.id} className="px-4 py-3">
                    <p className="text-muted-foreground text-xs font-medium">{field.label}</p>
                    {isFileUrl ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary mt-1 flex items-center gap-1 text-sm hover:underline"
                      >
                        <ExternalLink className="size-3.5" />
                        View uploaded file
                      </a>
                    ) : (
                      <p className="mt-1 text-sm">{value}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

function SmartFormDashboard() {
  const [tab, setTab] = useState<"create" | "my-forms" | "my-submissions">("create");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [schema, setSchema] = useState<GeneratedSchema | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // field editor state
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<SmartFormField | null>(null);

  // my-forms state
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);
  const [formResponses, setFormResponses] = useState<
    Record<string, ApiResponse[]>
  >({});
  const [loadingResponses, setLoadingResponses] = useState<string | null>(null);

  const { data: forms, isLoading: formsLoading } = useQuery({
    queryKey: ["smartforms"],
    queryFn: listSmartForms,
    enabled: tab === "my-forms",
    staleTime: 1000 * 30,
  });

  // ── field editor helpers ────────────────────────────────────────────────────

  function touchSchema() {
    setSavedUrl(null); // force re-save if fields changed after saving
  }

  function startEdit(field: SmartFormField) {
    setEditingFieldId(field.id);
    setEditDraft({ ...field });
  }

  function cancelEdit() {
    setEditingFieldId(null);
    setEditDraft(null);
  }

  function saveEdit() {
    if (!schema || !editDraft) return;
    setSchema({
      ...schema,
      fields: schema.fields.map((f) =>
        f.id === editingFieldId ? editDraft : f,
      ),
    });
    setEditingFieldId(null);
    setEditDraft(null);
    touchSchema();
  }

  function deleteField(id: string) {
    if (!schema) return;
    setSchema({ ...schema, fields: schema.fields.filter((f) => f.id !== id) });
    touchSchema();
  }

  function addField() {
    if (!schema) return;
    const newField: SmartFormField = {
      id: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      required: false,
    };
    setSchema({ ...schema, fields: [...schema.fields, newField] });
    startEdit(newField);
    touchSchema();
  }

  // ── generate / save / copy ─────────────────────────────────────────────────

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setSchema(null);
    setSavedUrl(null);
    setEditingFieldId(null);
    try {
      const res = await fetch("/api/smartform/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          (data as { error?: string }).error ?? "Generation failed",
        );
      setSchema((data as { schema: GeneratedSchema }).schema);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate form",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!schema) return;
    setSaving(true);
    try {
      const res = await fetch("/api/smartform/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: schema.title,
          description: schema.description,
          schema,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error((data as { error?: string }).error ?? "Save failed");
      const url = `${window.location.origin}/smartform/${(data as { formId: string }).formId}`;
      setSavedUrl(url);
      toast.success("Form saved! Share the link with students.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save form");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!savedUrl) return;
    await navigator.clipboard.writeText(savedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleViewResponses(formId: string) {
    if (expandedFormId === formId) {
      setExpandedFormId(null);
      return;
    }
    setExpandedFormId(formId);
    if (formResponses[formId]) return;
    setLoadingResponses(formId);
    try {
      const res = await fetch(`/api/smartform/responses/${formId}`);
      const data = await res.json();
      if (!res.ok)
        throw new Error((data as { error?: string }).error ?? "Failed to load");
      setFormResponses((prev) => ({
        ...prev,
        [formId]: (data as { responses: ApiResponse[] }).responses,
      }));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load responses",
      );
      setExpandedFormId(null);
    } finally {
      setLoadingResponses(null);
    }
  }

  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="from-primary/25 pointer-events-none absolute -top-32 -right-16 h-96 w-96 rounded-full bg-linear-to-br to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-linear-to-br from-violet-500/20 to-transparent blur-3xl" />

        <div className="relative container mx-auto max-w-4xl px-4 pt-12 pb-8">
          <span className="text-primary bg-primary/10 mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered
          </span>
          <h1 className="font-serif text-4xl leading-[1.05] font-normal">
            Describe a form, get it in seconds.
          </h1>
          <p className="text-muted-foreground mt-3 max-w-lg text-base">
            Tell SmartForm what you need and it generates editable fields
            instantly. Share a link, collect responses, export to Excel.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 pb-8">
      <div className="mb-6 flex gap-6 border-b">
        {(["create", "my-forms", "my-submissions"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-semibold transition-colors ${
              tab === t
                ? "border-primary text-foreground -mb-px border-b-2"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "create" ? "Create Form" : t === "my-forms" ? "My Forms" : "My Submissions"}
          </button>
        ))}
      </div>

      {/* ── CREATE TAB ─────────────────────────────────────────────────────── */}
      {tab === "create" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <WandSparkles className="size-5" />
                Describe your form
              </CardTitle>
              <CardDescription>
                Tell us what kind of form you need and we&apos;ll generate it
                instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g. Industrial visit consent form with name, USN, branch, t-shirt size, medical conditions, parent contact..."
                rows={4}
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setPrompt(chip.text)}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full px-3 py-1 text-xs transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate Form
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {schema && (
            <Card>
              <CardHeader>
                <CardTitle>{schema.title}</CardTitle>
                {schema.description && (
                  <CardDescription>{schema.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {schema.fields.length} fields — edit before saving
                </p>

                <ul className="space-y-2">
                  {schema.fields.map((field) =>
                    editingFieldId === field.id && editDraft ? (
                      <li key={field.id} className="rounded-lg border p-4">
                        <FieldEditor
                          draft={editDraft}
                          onChange={setEditDraft}
                          onSave={saveEdit}
                          onCancel={cancelEdit}
                        />
                      </li>
                    ) : (
                      <li
                        key={field.id}
                        className="hover:border-primary/40 flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors"
                      >
                        <span className="font-medium">
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">
                            {field.type}
                          </Badge>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => startEdit(field)}
                            aria-label="Edit field"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => deleteField(field.id)}
                            aria-label="Delete field"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </li>
                    ),
                  )}
                </ul>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={addField}
                  disabled={!!editingFieldId}
                >
                  <Plus className="size-4" />
                  Add Field
                </Button>

                <div className="border-t pt-4">
                  {!savedUrl ? (
                    <Button
                      onClick={handleSave}
                      disabled={saving || !!editingFieldId}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save & Get Link"
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-xs font-medium">
                        Share this link with students
                      </p>
                      <div className="flex items-center gap-2 rounded-lg border p-2">
                        <Link
                          href={savedUrl}
                          target="_blank"
                          className="text-primary min-w-0 flex-1 truncate text-sm hover:underline"
                        >
                          {savedUrl}
                        </Link>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={handleCopy}
                          aria-label="Copy link"
                        >
                          {copied ? (
                            <Check className="size-4 text-green-500" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── MY FORMS TAB ──────────────────────────────────────────────────── */}
      {tab === "my-forms" && (
        <div className="space-y-4">
          {formsLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          )}
          {!formsLoading && (!forms || forms.length === 0) && (
            <div className="text-muted-foreground rounded-xl border py-16 text-center text-sm">
              No forms yet. Switch to the Create Form tab to get started.
            </div>
          )}
          {forms?.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              expanded={expandedFormId === form.id}
              responses={formResponses[form.id]}
              loadingResponses={loadingResponses === form.id}
              onViewResponses={() => handleViewResponses(form.id)}
              onDownload={() =>
                window.open(`/api/smartform/export/${form.id}`, "_blank")
              }
            />
          ))}
        </div>
      )}

      {/* ── MY SUBMISSIONS TAB ────────────────────────────────────────────── */}
      {tab === "my-submissions" && <MySubmissionsList />}
      </div>
    </div>
  );
}

// ─── Inline field editor ──────────────────────────────────────────────────────

function FieldEditor({
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  draft: SmartFormField;
  onChange: (f: SmartFormField) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const needsOptions = ["select", "radio", "checkbox"].includes(draft.type);
  const needsScale = draft.type === "scale";
  const needsPlaceholder = [
    "text",
    "email",
    "tel",
    "number",
    "date",
    "textarea",
  ].includes(draft.type);

  const optionsText = (draft.options ?? []).join("\n");

  function set<K extends keyof SmartFormField>(key: K, val: SmartFormField[K]) {
    onChange({ ...draft, [key]: val });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Label</Label>
          <Input
            value={draft.label}
            onChange={(e) => set("label", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <select
            value={draft.type}
            onChange={(e) => set("type", e.target.value)}
            className="border-input bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {needsPlaceholder && (
        <div className="space-y-1">
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={draft.placeholder ?? ""}
            onChange={(e) => set("placeholder", e.target.value)}
            placeholder="Optional hint text…"
          />
        </div>
      )}

      {needsOptions && (
        <div className="space-y-1">
          <Label className="text-xs">Options (one per line)</Label>
          <textarea
            rows={4}
            value={optionsText}
            onChange={(e) =>
              set(
                "options",
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
            placeholder={"Option A\nOption B\nOption C"}
          />
        </div>
      )}

      {needsScale && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Min</Label>
            <Input
              type="number"
              value={draft.min ?? 1}
              onChange={(e) => set("min", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max</Label>
            <Input
              type="number"
              value={draft.max ?? 5}
              onChange={(e) => set("max", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Min label</Label>
            <Input
              value={draft.minLabel ?? ""}
              onChange={(e) => set("minLabel", e.target.value)}
              placeholder="Poor"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max label</Label>
            <Input
              value={draft.maxLabel ?? ""}
              onChange={(e) => set("maxLabel", e.target.value)}
              placeholder="Excellent"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.required}
            onChange={(e) => set("required", e.target.checked)}
            className="accent-primary"
          />
          Required
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onSave} disabled={!draft.label.trim()}>
          <Check className="size-3.5" />
          Save field
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="size-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── FormCard + ResponseTable ─────────────────────────────────────────────────

function FormCard({
  form,
  expanded,
  responses,
  loadingResponses,
  onViewResponses,
  onDownload,
}: {
  form: SmartFormSummary;
  expanded: boolean;
  responses?: ApiResponse[];
  loadingResponses: boolean;
  onViewResponses: () => void;
  onDownload: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {form.title}
              <Badge
                className={
                  form.isActive
                    ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary"
                }
              >
                {form.isActive ? "Active" : "Closed"}
              </Badge>
            </CardTitle>
            {form.description && (
              <CardDescription className="mt-1">
                {form.description}
              </CardDescription>
            )}
            <p className="text-muted-foreground mt-2 text-xs">
              {new Date(form.createdAt).toLocaleDateString()} ·{" "}
              {form.responseCount}{" "}
              {form.responseCount === 1 ? "response" : "responses"}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={onViewResponses}>
              {expanded ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              {expanded ? "Hide" : "View"}
            </Button>
            <Button size="sm" variant="outline" onClick={onDownload}>
              <Download className="size-3.5" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          {loadingResponses && (
            <div className="flex justify-center py-6">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            </div>
          )}
          {!loadingResponses && responses && responses.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No responses yet.
            </p>
          )}
          {!loadingResponses && responses && responses.length > 0 && (
            <ResponseTable fields={form.schema.fields} responses={responses} />
          )}
        </CardContent>
      )}
    </Card>
  );
}

function ResponseTable({
  fields,
  responses,
}: {
  fields: SmartFormField[];
  responses: ApiResponse[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">
              Email
            </th>
            {fields.map((f) => (
              <th
                key={f.id}
                className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap"
              >
                {f.label}
              </th>
            ))}
            <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">
              Submitted At
            </th>
          </tr>
        </thead>
        <tbody>
          {responses.map((r) => (
            <tr key={r.id} className="hover:bg-muted/30 border-b last:border-0">
              <td className="px-3 py-2 text-xs whitespace-nowrap">
                {String(r.answers._email ?? "")}
              </td>
              {fields.map((f) => {
                const val = r.answers[f.id];
                const display = Array.isArray(val)
                  ? val.join(", ")
                  : String(val ?? "");
                const isUrl = typeof val === "string" && val.startsWith("http");
                return (
                  <td key={f.id} className="px-3 py-2 whitespace-nowrap">
                    {isUrl ? (
                      <a
                        href={val}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View file
                      </a>
                    ) : (
                      display
                    )}
                  </td>
                );
              })}
              <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                {new Date(r.submittedAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
