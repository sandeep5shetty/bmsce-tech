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

export interface AdminOption {
  email: string;
  name: string | null;
  /** False for a faculty-allowlist email that has never signed into the site — still invitable by email, just has no account (yet) to show a name for. */
  hasAccount: boolean;
}

interface AdminMultiPickerProps {
  value: AdminOption[];
  onChange: (admins: AdminOption[]) => void;
  /** Emails to exclude from the pickable list entirely (self, poll creator, existing collaborators). Case-insensitive. */
  excludeEmails?: Set<string>;
  disabled?: boolean;
  triggerLabel?: string;
  emptyLabel?: string;
}

function AdminRow({
  a,
  selected,
  onToggle,
}: {
  a: AdminOption;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <CommandItem
      value={`${a.name ?? ""} ${a.email}`}
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
        <p className="truncate text-sm font-medium">{a.name ?? a.email}</p>
        <p className="text-muted-foreground truncate text-xs">
          {a.name ? a.email : null}
          {!a.hasAccount && (
            <span className="text-amber-600 dark:text-amber-500">
              {a.name ? " · " : ""}Hasn&apos;t signed in yet
            </span>
          )}
        </p>
      </div>
    </CommandItem>
  );
}

/**
 * Search-and-multi-select picker for elective-poll admins — structural
 * clone of student-multi-picker.tsx (same Popover+Command, pinned
 * "Selected" group, chip-based removal), retyped for admin users instead of
 * roster students. Keyed by email rather than id, since a faculty-allowlist
 * admin who's never signed in has no user id yet — they're still invitable,
 * the invite just gets linked to their account the first time they log in.
 */
export function AdminMultiPicker({
  value,
  onChange,
  excludeEmails,
  disabled,
  triggerLabel = "Add collaborators",
  emptyLabel = "No collaborators selected yet.",
}: AdminMultiPickerProps) {
  const [admins, setAdmins] = useState<AdminOption[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/elective-polls/v1/admins")
      .then((r) => r.json())
      .then((body) => setAdmins(body.admins ?? []))
      .catch(() => setAdmins([]));
  }, []);

  function toggle(a: AdminOption) {
    const already = value.some((m) => m.email === a.email);
    onChange(
      already ? value.filter((m) => m.email !== a.email) : [...value, a],
    );
  }

  function remove(email: string) {
    onChange(value.filter((m) => m.email !== email));
  }

  const selectedEmails = useMemo(
    () => new Set(value.map((m) => m.email.toLowerCase())),
    [value],
  );
  const pickable = useMemo(
    () =>
      admins?.filter((a) => !excludeEmails?.has(a.email.toLowerCase())) ?? [],
    [admins, excludeEmails],
  );
  const selectedInList = pickable.filter((a) =>
    selectedEmails.has(a.email.toLowerCase()),
  );
  const unselectedInList = pickable.filter(
    (a) => !selectedEmails.has(a.email.toLowerCase()),
  );

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
                ? `${value.length} admin${value.length === 1 ? "" : "s"} selected`
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
            <CommandInput placeholder="Search by name or email..." />
            <CommandList className="max-h-80">
              {admins === null ? (
                <div className="text-muted-foreground flex items-center gap-2 p-4 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading admins...
                </div>
              ) : (
                <>
                  <CommandEmpty>No admin found.</CommandEmpty>
                  {selectedInList.length > 0 && (
                    <CommandGroup
                      heading={`Selected (${selectedInList.length})`}
                    >
                      {selectedInList.map((a) => (
                        <AdminRow
                          key={a.email}
                          a={a}
                          selected
                          onToggle={() => toggle(a)}
                        />
                      ))}
                    </CommandGroup>
                  )}
                  <CommandGroup
                    heading={
                      selectedInList.length > 0 ? "All admins" : undefined
                    }
                  >
                    {unselectedInList.map((a) => (
                      <AdminRow
                        key={a.email}
                        a={a}
                        selected={false}
                        onToggle={() => toggle(a)}
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
              {value.length} admin{value.length === 1 ? "" : "s"} selected
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
                key={m.email}
                className="bg-muted flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-3 text-xs"
              >
                {m.name ?? m.email}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => remove(m.email)}
                  className="hover:bg-destructive/15 hover:text-destructive rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${m.name ?? m.email}`}
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
