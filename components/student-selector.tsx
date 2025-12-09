"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface Student {
  id: string;
  name: string;
  usn: string;
  section: string;
}

interface StudentSelectorProps {
  value?: string;
  onSelect: (studentId: string) => void;
  required?: boolean;
}

export function StudentSelector({
  value,
  onSelect,
  required,
}: StudentSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(
    null
  );

  React.useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(
          `/api/students?search=${encodeURIComponent(search)}`
        );
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    const debounce = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(debounce);
  }, [search]);

  React.useEffect(() => {
    if (value && students.length > 0) {
      const student = students.find((s) => s.id === value);
      if (student) {
        setSelectedStudent(student);
      }
    }
  }, [value, students]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-base h-auto min-h-10 py-2"
        >
          {selectedStudent ? (
            <span className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-1 sm:gap-2 text-left">
              <span className="truncate max-w-full">
                {selectedStudent.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedStudent.usn}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground text-left">
              {required ? "Select your name..." : "Select your name..."}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) max-w-[95vw] p-0"
        align="start"
        sideOffset={4}
        alignOffset={0}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search your name..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[180px] overflow-y-auto">
            <CommandEmpty>No student found.</CommandEmpty>
            <CommandGroup>
              {students.map((student) => (
                <CommandItem
                  key={student.id}
                  value={student.id}
                  onSelect={() => {
                    setSelectedStudent(student);
                    onSelect(student.id);
                    setOpen(false);
                  }}
                  className="flex items-start sm:items-center"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0 mt-0.5 sm:mt-0",
                      value === student.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-1 gap-1 min-w-0">
                    <span className="truncate">{student.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {student.usn}
                    </span>
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
