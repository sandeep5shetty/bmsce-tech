"use client";

import { useEffect, useState } from "react";

import { Check, Loader2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { type RosterStudent, StudentMultiPicker } from "./student-multi-picker";

export type AudienceMemberDraft = RosterStudent;

export type AudienceMode = "all" | "group" | "custom";

export interface AudienceDraft {
  mode: AudienceMode;
  rule: { batch: string; section: string } | null;
  members: AudienceMemberDraft[];
  excludedMembers: AudienceMemberDraft[];
}

export const EMPTY_AUDIENCE: AudienceDraft = {
  mode: "all",
  rule: null,
  members: [],
  excludedMembers: [],
};

interface AudienceGroup {
  key: string;
  batch: string;
  section: string | null;
  label: string;
  studentCount: number;
  excludedStudents?: AudienceMemberDraft[];
}

interface AudienceRuleEditorProps {
  value: AudienceDraft;
  onChange: (value: AudienceDraft) => void;
  disabled?: boolean;
}

function sameStudentSet(a: AudienceMemberDraft[], b: AudienceMemberDraft[]) {
  if (a.length !== b.length) return false;
  const ids = new Set(a.map((s) => s.id));
  return b.every((s) => ids.has(s.id));
}

export function AudienceRuleEditor({
  value,
  onChange,
  disabled,
}: AudienceRuleEditorProps) {
  const [groups, setGroups] = useState<AudienceGroup[] | null>(null);

  useEffect(() => {
    fetch("/api/elective-polls/v1/audience-groups")
      .then((r) => r.json())
      .then((body) => setGroups(body.groups ?? []))
      .catch(() => setGroups([]));
  }, []);

  // Selecting a group always fully applies its rule + any preset exclusions
  // (e.g. "...Excluding Agentic AI Students" comes with a baked-in exclusion
  // list) so switching groups never leaves stale exclusions behind.
  function selectGroup(group: AudienceGroup) {
    onChange({
      ...value,
      rule: { batch: group.batch, section: group.section ?? "" },
      excludedMembers: group.excludedStudents ?? [],
    });
  }

  // A group's radio dot lights up only when both its rule AND its preset
  // exclusion set match the current draft exactly — this is what lets two
  // groups share the same batch/section (e.g. "Both Sections" vs "...Excluding
  // Agentic AI Students") without both appearing selected at once.
  function isGroupSelected(group: AudienceGroup) {
    const ruleMatches =
      value.rule?.batch === group.batch &&
      (value.rule?.section || "") === (group.section ?? "");
    if (!ruleMatches) return false;
    return sameStudentSet(value.excludedMembers, group.excludedStudents ?? []);
  }

  return (
    <div className="space-y-3">
      <Label>Audience</Label>
      <Tabs
        value={value.mode}
        onValueChange={(mode) =>
          onChange({ ...value, mode: mode as AudienceMode })
        }
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" disabled={disabled}>
            All Students
          </TabsTrigger>
          <TabsTrigger value="group" disabled={disabled}>
            Specific Group
          </TabsTrigger>
          <TabsTrigger value="custom" disabled={disabled}>
            Custom List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <p className="text-muted-foreground pt-1 text-xs">
            Every logged-in student will be able to respond to this poll.
          </p>
        </TabsContent>

        <TabsContent value="group" className="space-y-4 pt-1">
          {groups === null ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading roster groups...
            </div>
          ) : groups.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              No roster groups found yet.
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => {
                const selected = isGroupSelected(group);
                return (
                  <button
                    key={group.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectGroup(group)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                      selected
                        ? "border-green-500 bg-green-50 ring-2 ring-green-500/30 dark:bg-green-950/30"
                        : "border-border hover:border-primary/50"
                    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Radio dot — group mode is single-select, not a checkbox */}
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          selected
                            ? "border-green-500 bg-green-500"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {selected && (
                          <Check className="h-3.5 w-3.5 text-white" />
                        )}
                      </span>
                      <span className="text-sm font-medium">{group.label}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {group.studentCount} student
                      {group.studentCount === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {value.rule && (
            <div className="space-y-2 border-t pt-3">
              <Label className="text-sm font-normal">
                Exclude specific students (optional)
              </Label>
              <StudentMultiPicker
                value={value.excludedMembers}
                onChange={(excludedMembers) =>
                  onChange({ ...value, excludedMembers })
                }
                disabled={disabled}
                triggerLabel="Exclude students from this group"
                emptyLabel="No exclusions — everyone in the group can respond."
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom" className="pt-1">
          <StudentMultiPicker
            value={value.members}
            onChange={(members) => onChange({ ...value, members })}
            disabled={disabled}
            triggerLabel="Add students to this poll"
            emptyLabel="No students added yet — search and add students above."
          />
        </TabsContent>
      </Tabs>
      <p className="text-muted-foreground text-xs">
        {value.mode === "all" && "Anyone logged in can respond."}
        {value.mode === "group" &&
          (value.excludedMembers.length > 0
            ? `Students in the selected group can respond, except ${value.excludedMembers.length} excluded student${value.excludedMembers.length === 1 ? "" : "s"}.`
            : "Only students in the selected group can respond.")}
        {value.mode === "custom" &&
          "Only the students you've added can respond."}
      </p>
    </div>
  );
}
