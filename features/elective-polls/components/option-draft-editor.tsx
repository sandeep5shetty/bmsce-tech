"use client";

import { useState } from "react";

import { BookOpen, Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { MCA_ELECTIVE_CATALOG } from "@/lib/electives/mca-elective-catalog";

export interface OptionDraft {
  label: string;
  description: string;
  capacity: string;
}

interface OptionDraftEditorProps {
  value: OptionDraft[];
  onChange: (options: OptionDraft[]) => void;
  disabled?: boolean;
}

function AddFromCatalogButton({
  addedLabels,
  onAdd,
  disabled,
}: {
  addedLabels: Set<string>;
  onAdd: (title: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="outline" disabled={disabled}>
          <BookOpen className="mr-1.5 h-3.5 w-3.5" />
          Add from catalog
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Command>
          <CommandInput placeholder="Search electives..." />
          <CommandList className="max-h-72">
            <CommandEmpty>No matching elective.</CommandEmpty>
            <CommandGroup>
              {MCA_ELECTIVE_CATALOG.map((entry) => {
                const added = addedLabels.has(entry.title);
                return (
                  <CommandItem
                    key={entry.code}
                    value={`${entry.code} ${entry.title}`}
                    disabled={added}
                    onSelect={() => {
                      onAdd(entry.title);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {entry.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {entry.code}
                      </p>
                    </div>
                    {added && <Check className="h-4 w-4 text-green-600" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function OptionDraftEditor({
  value,
  onChange,
  disabled,
}: OptionDraftEditorProps) {
  function updateOption(index: number, patch: Partial<OptionDraft>) {
    onChange(value.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  function removeOption(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addOption() {
    onChange([...value, { label: "", description: "", capacity: "" }]);
  }

  function addFromCatalog(title: string) {
    // Fill the trailing empty row in-place instead of always appending, so
    // clicking a catalog entry on a fresh form doesn't leave a stray blank
    // option behind it.
    const lastIndex = value.length - 1;
    const last = value[lastIndex];
    if (last && last.label.trim() === "") {
      updateOption(lastIndex, { label: title });
    } else {
      onChange([...value, { label: title, description: "", capacity: "" }]);
    }
  }

  const addedLabels = new Set(value.map((o) => o.label.trim()).filter(Boolean));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Options (each with a seat capacity)</Label>
        <div className="flex gap-2">
          <AddFromCatalogButton
            addedLabels={addedLabels}
            onAdd={addFromCatalog}
            disabled={disabled}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addOption}
            disabled={disabled}
          >
            + Add option
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {value.map((option, index) => (
          <div
            key={index}
            className="flex items-start gap-2 rounded-lg border p-3"
          >
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Option label (e.g. Deep Learning)"
                value={option.label}
                onChange={(e) => updateOption(index, { label: e.target.value })}
                disabled={disabled}
              />
              <Input
                placeholder="Description (optional)"
                value={option.description}
                onChange={(e) =>
                  updateOption(index, { description: e.target.value })
                }
                disabled={disabled}
              />
            </div>
            <Input
              type="number"
              min={1}
              placeholder="Seats"
              value={option.capacity}
              onChange={(e) =>
                updateOption(index, { capacity: e.target.value })
              }
              disabled={disabled}
              className="focus-visible:border-primary focus-visible:ring-primary/40 w-24 focus-visible:ring-2"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeOption(index)}
              disabled={disabled || value.length <= 1}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
