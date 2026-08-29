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
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { batchOptions } from "@/lib/batches";

/**
 * Batch picker with the "other" input living inside the dropdown itself: the
 * combobox's own search field doubles as the free-text entry, and typing a
 * batch that isn't on the list surfaces a "Use <typed value>" item at the
 * bottom. No second input appears outside the control.
 */
export function BatchCombobox({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (batch: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim();
  // Only offer the custom entry for something genuinely new — not for a
  // partially typed known batch, which the list already shows.
  const canUseCustom =
    trimmedQuery.length > 0 &&
    trimmedQuery.length <= 20 &&
    !batchOptions.some(
      (option) => option.toLowerCase() === trimmedQuery.toLowerCase(),
    );

  function commit(batch: string) {
    onChange(batch);
    setQuery("");
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span
            className={value ? "truncate" : "text-muted-foreground truncate"}
          >
            {value || "Select batch"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[220px] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search or type a batch..."
            value={query}
            onValueChange={setQuery}
            maxLength={20}
          />
          <CommandList>
            {!canUseCustom && <CommandEmpty>No batch found.</CommandEmpty>}
            <CommandGroup>
              {batchOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => commit(option)}
                >
                  <Check
                    className={`h-4 w-4 ${
                      value === option ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>

            {canUseCustom && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Other" forceMount>
                  <CommandItem
                    // forceMount so cmdk's filter can never hide the escape
                    // hatch for whatever the user typed.
                    value={trimmedQuery}
                    forceMount
                    onSelect={() => commit(trimmedQuery)}
                  >
                    <Plus className="h-4 w-4" />
                    Use &ldquo;{trimmedQuery}&rdquo;
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
