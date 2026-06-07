"use client";

import { useState } from "react";

import { Check, ChevronsUpDown } from "lucide-react";

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

type UserOption = { id: string; name: string | null; email: string };

interface StudentComboboxProps {
  users: UserOption[];
  value: string;
  onChange: (userId: string) => void;
  disabled?: boolean;
}

export function StudentCombobox({
  users,
  value,
  onChange,
  disabled,
}: StudentComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = users.find((u) => u.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between text-left font-normal"
        >
          {selected ? (
            <span className="truncate">
              {selected.name ?? selected.email}
            </span>
          ) : (
            <span className="text-muted-foreground">Search your name...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Type your name..." />
          <CommandList>
            <CommandEmpty>No student found.</CommandEmpty>
            <CommandGroup>
              {users.map((u) => (
                <CommandItem
                  key={u.id}
                  value={`${u.name ?? ""} ${u.email}`}
                  onSelect={() => {
                    onChange(u.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === u.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium">{u.name ?? "Unnamed"}</p>
                    <p className="text-muted-foreground text-xs">{u.email}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
