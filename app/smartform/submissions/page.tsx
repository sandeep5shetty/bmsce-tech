"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  ExternalLink,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { type MySubmission, listMySubmissions } from "@/actions/smartform";

export default function MySubmissionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: listMySubmissions,
    staleTime: 1000 * 30,
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">My Submissions</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Forms you have filled out.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-xl border py-16 text-center text-sm">
          <ClipboardList className="size-10 opacity-40" />
          <p>You haven&apos;t submitted any forms yet.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-4">
          {data.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionCard({ submission }: { submission: MySubmission }) {
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
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="size-3.5" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5" />
                  View Response
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          <div className="rounded-lg border">
            <div className="bg-muted/50 border-b px-4 py-2">
              <p className="text-xs font-medium">Your Answers</p>
            </div>
            <div className="divide-y">
              {fields.map((field) => {
                const raw = submission.answers[field.id];
                const value = Array.isArray(raw)
                  ? raw.join(", ")
                  : String(raw ?? "—");
                const isFileUrl =
                  typeof raw === "string" &&
                  (raw.startsWith("http://") || raw.startsWith("https://"));

                return (
                  <div key={field.id} className="px-4 py-3">
                    <p className="text-muted-foreground text-xs font-medium">
                      {field.label}
                      {field.required && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          required
                        </Badge>
                      )}
                    </p>
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
