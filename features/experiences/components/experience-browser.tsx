"use client";

import { useMemo, useState } from "react";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EmptyAddCard } from "@/components/common/empty-add-card";

import { ExperienceListItem } from "../lib/types";
import { ExperienceCard } from "./experience-card";

type FilterKey = "all" | "verified" | "selected";

const ALL_BATCHES = "__all__";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "verified", label: "✓ Verified only" },
  { key: "selected", label: "Selected" },
];

export function ExperienceBrowser({
  experiences,
}: {
  experiences: ExperienceListItem[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [batch, setBatch] = useState(ALL_BATCHES);

  // Driven by what has actually been shared rather than the full batch list, so
  // the dropdown never offers a batch with zero experiences behind it.
  const batches = useMemo(
    () => [...new Set(experiences.map((e) => e.batch))].sort().reverse(),
    [experiences],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return experiences.filter((exp) => {
      if (filter === "verified" && !exp.isVerified) return false;
      if (filter === "selected" && exp.result !== "Selected") return false;
      if (batch !== ALL_BATCHES && exp.batch !== batch) return false;
      if (!q) return true;
      return (
        exp.companyName.toLowerCase().includes(q) ||
        exp.role.toLowerCase().includes(q) ||
        exp.batch.toLowerCase().includes(q)
      );
    });
  }, [experiences, search, filter, batch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search company, role, or batch..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {batches.length > 1 && (
          <Select value={batch} onValueChange={setBatch}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BATCHES}>All batches</SelectItem>
              {batches.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                filter === f.key
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyAddCard
          title="No experiences match"
          description="Try a different search or filter, or be the first to share one."
          href="/experiences/new"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </div>
      )}
    </div>
  );
}
