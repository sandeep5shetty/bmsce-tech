"use client";

import { useState } from "react";

import { Check, ChevronsUpDown, Plus } from "lucide-react";

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

interface BatchComboboxProps {
  value: string;
  onChange: (batch: string) => void;
  batches: string[];
  disabled?: boolean;
}

/**
 * A searchable batch picker that also lets the admin "create" a batch simply
 * by typing a value that isn't in the existing list yet — there's no
 * separate batch registry table, so a new batch comes into existence the
 * moment a student is saved with it (mirrors how batch already worked as a
 * free-text field, just with autocomplete instead of manual retyping).
 */
export function BatchCombobox({
  value,
  onChange,
  batches,
  disabled,
}: BatchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim();
  const filtered = normalizedQuery
    ? batches.filter((b) =>
        b.toLowerCase().includes(normalizedQuery.toLowerCase()),
      )
    : batches;
  const exactMatch = batches.some(
    (b) => b.toLowerCase() === normalizedQuery.toLowerCase(),
  );

  function select(batch: string) {
    onChange(batch);
    setQuery("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value || "Select or create a batch..."}
          </span>
          <ChevronsUpDown className="text-muted-foreground h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or create a batch..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-60">
            {filtered.length === 0 && !normalizedQuery && (
              <CommandEmpty>No batches yet.</CommandEmpty>
            )}
            {filtered.length > 0 && (
              <CommandGroup heading="Existing batches">
                {filtered.map((b) => (
                  <CommandItem key={b} value={b} onSelect={() => select(b)}>
                    <Check
                      className={cn(
                        "h-3.5 w-3.5",
                        value === b ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {b}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {normalizedQuery && !exactMatch && (
              <CommandGroup heading="Create new">
                <CommandItem
                  value={`__create__${normalizedQuery}`}
                  onSelect={() => select(normalizedQuery)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create batch &quot;{normalizedQuery}&quot;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
