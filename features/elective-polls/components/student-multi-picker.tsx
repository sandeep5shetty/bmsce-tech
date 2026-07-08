"use client";

import { useEffect, useMemo, useState } from "react";

import { Check, ChevronsUpDown, Loader2, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

export interface RosterStudent {
  id: string;
  name: string;
  usn: string;
  email: string;
  batch: string;
  section: string | null;
}

interface StudentMultiPickerProps {
  value: RosterStudent[];
  onChange: (students: RosterStudent[]) => void;
  disabled?: boolean;
  triggerLabel?: string;
  emptyLabel?: string;
}

function StudentRow({
  s,
  selected,
  onToggle,
}: {
  s: RosterStudent;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <CommandItem
      value={`${s.name} ${s.usn} ${s.email}`}
      onSelect={onToggle}
      className="cursor-pointer"
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected
            ? "border-green-500 bg-green-500"
            : "border-muted-foreground/40",
        )}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{s.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {s.usn} · Sec {s.section}
        </p>
      </div>
    </CommandItem>
  );
}

/**
 * Shared search-and-multi-select picker for roster students — used for both
 * the "custom list" audience (inclusion) and the "specific group" audience's
 * exclusion list. Loads the whole roster once and filters client-side via
 * cmdk (the roster is small, ~100s of rows), so the results list is never
 * truncated and there's no per-keystroke network round trip.
 *
 * Already-selected students are pinned in their own "Selected" section at
 * the top of the popover, so removing someone is exactly as easy as adding
 * them — the same searchable, clickable list, not a separate mechanism.
 */
export function StudentMultiPicker({
  value,
  onChange,
  disabled,
  triggerLabel = "Add students",
  emptyLabel = "No students added yet.",
}: StudentMultiPickerProps) {
  const [roster, setRoster] = useState<RosterStudent[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/elective-polls/v1/roster/search")
      .then((r) => r.json())
      .then((body) => setRoster(body.students ?? []))
      .catch(() => setRoster([]));
  }, []);

  function toggle(s: RosterStudent) {
    const already = value.some((m) => m.id === s.id);
    onChange(already ? value.filter((m) => m.id !== s.id) : [...value, s]);
  }

  function remove(id: string) {
    onChange(value.filter((m) => m.id !== id));
  }

  const selectedIds = useMemo(() => new Set(value.map((m) => m.id)), [value]);
  const selectedInRoster = roster?.filter((s) => selectedIds.has(s.id)) ?? [];
  const unselectedInRoster =
    roster?.filter((s) => !selectedIds.has(s.id)) ?? [];

  return (
    <div className="space-y-2.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {value.length > 0
                ? `${value.length} student${value.length === 1 ? "" : "s"} selected`
                : triggerLabel}
            </span>
            <ChevronsUpDown className="text-muted-foreground h-4 w-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search by name, USN, or email..." />
            <CommandList className="max-h-80">
              {roster === null ? (
                <div className="text-muted-foreground flex items-center gap-2 p-4 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading roster...
                </div>
              ) : (
                <>
                  <CommandEmpty>No student found.</CommandEmpty>
                  {selectedInRoster.length > 0 && (
                    <CommandGroup
                      heading={`Selected (${selectedInRoster.length})`}
                    >
                      {selectedInRoster.map((s) => (
                        <StudentRow
                          key={s.id}
                          s={s}
                          selected
                          onToggle={() => toggle(s)}
                        />
                      ))}
                    </CommandGroup>
                  )}
                  <CommandGroup
                    heading={
                      selectedInRoster.length > 0 ? "All students" : undefined
                    }
                  >
                    {unselectedInRoster.map((s) => (
                      <StudentRow
                        key={s.id}
                        s={s}
                        selected={false}
                        onToggle={() => toggle(s)}
                      />
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length === 0 ? (
        <p className="text-muted-foreground text-xs">{emptyLabel}</p>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              {value.length} student{value.length === 1 ? "" : "s"} selected
            </p>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange([])}
              className="text-muted-foreground hover:text-destructive text-xs underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {value.map((m) => (
              <span
                key={m.id}
                className="bg-muted flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-3 text-xs"
              >
                {m.name}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => remove(m.id)}
                  className="hover:bg-destructive/15 hover:text-destructive rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${m.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
