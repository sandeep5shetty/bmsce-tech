"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { listSmartForms, type SmartFormField, type SmartFormSummary } from "@/actions/smartform";

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

export default function SmartFormPage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    setUnlocked(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (unlocked === null) return null;

  if (!unlocked) {
    return (
      <CodeGate
        onUnlock={() => {
          localStorage.setItem(STORAGE_KEY, "true");
          setUnlocked(true);
        }}
      />
    );
  }

  return <SmartFormDashboard />;
}

function CodeGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
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
        onUnlock();
      }
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <ShieldCheck className="text-primary mb-2 size-10" />
          <CardTitle>SmartForm Access</CardTitle>
          <CardDescription>
            Enter the admin code to access SmartForm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-code">Admin Code</Label>
              <Input
                id="admin-code"
                type="password"
                placeholder="Enter admin code..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Unlock SmartForm"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SmartFormDashboard() {
  const [tab, setTab] = useState<"create" | "my-forms">("create");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [schema, setSchema] = useState<GeneratedSchema | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, ApiResponse[]>>({});
  const [loadingResponses, setLoadingResponses] = useState<string | null>(null);

  const { data: forms, isLoading: formsLoading } = useQuery({
    queryKey: ["smartforms"],
    queryFn: listSmartForms,
    enabled: tab === "my-forms",
    staleTime: 1000 * 30,
  });

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setSchema(null);
    setSavedUrl(null);
    try {
      const res = await fetch("/api/smartform/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Generation failed");
      setSchema((data as { schema: GeneratedSchema }).schema);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate form");
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
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Save failed");
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
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to load");
      setFormResponses((prev) => ({
        ...prev,
        [formId]: (data as { responses: ApiResponse[] }).responses,
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load responses");
      setExpandedFormId(null);
    } finally {
      setLoadingResponses(null);
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">SmartForm</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Generate AI-powered forms for your class in seconds.
        </p>
      </div>

      <div className="mb-6 flex gap-2 border-b">
        {(["create", "my-forms"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium transition-colors ${
              tab === t
                ? "border-primary text-foreground -mb-px border-b-2"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "create" ? "Create Form" : "My Forms"}
          </button>
        ))}
      </div>

      {tab === "create" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <WandSparkles className="size-5" />
                Describe your form
              </CardTitle>
              <CardDescription>
                Tell us what kind of form you need and we&apos;ll generate it instantly.
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
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  {schema.fields.length} fields
                </p>
                <ul className="space-y-2">
                  {schema.fields.map((field) => (
                    <li
                      key={field.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">
                        {field.label}
                        {field.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </span>
                      <Badge variant="secondary" className="capitalize">
                        {field.type}
                      </Badge>
                    </li>
                  ))}
                </ul>

                {!savedUrl ? (
                  <Button onClick={handleSave} disabled={saving}>
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
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
              onDownload={() => window.open(`/api/smartform/export/${form.id}`, "_blank")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
              <Badge variant={form.isActive ? "default" : "secondary"}>
                {form.isActive ? "Active" : "Closed"}
              </Badge>
            </CardTitle>
            {form.description && (
              <CardDescription className="mt-1">{form.description}</CardDescription>
            )}
            <p className="text-muted-foreground mt-2 text-xs">
              {new Date(form.createdAt).toLocaleDateString()} ·{" "}
              {form.responseCount} {form.responseCount === 1 ? "response" : "responses"}
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
              {fields.map((f) => (
                <td key={f.id} className="px-3 py-2 whitespace-nowrap">
                  {Array.isArray(r.answers[f.id])
                    ? (r.answers[f.id] as string[]).join(", ")
                    : String(r.answers[f.id] ?? "")}
                </td>
              ))}
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
