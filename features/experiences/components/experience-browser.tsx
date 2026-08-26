"use client";

import { useMemo, useState } from "react";

import { Search } from "lucide-react";

import { EmptyAddCard } from "@/components/common/empty-add-card";
import { Input } from "@/components/ui/input";

import { ExperienceListItem } from "../lib/types";
import { ExperienceCard } from "./experience-card";

type FilterKey = "all" | "verified" | "selected";

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return experiences.filter((exp) => {
      if (filter === "verified" && !exp.isVerified) return false;
      if (filter === "selected" && exp.result !== "Selected") return false;
      if (!q) return true;
      return (
        exp.companyName.toLowerCase().includes(q) ||
        exp.role.toLowerCase().includes(q) ||
        exp.batch.toLowerCase().includes(q)
      );
    });
  }, [experiences, search, filter]);

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
