"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";

import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";

import { Cross, Tick } from "@/components/icons";

interface TechStack {
  label: string;
  image?: string;
}

interface TechStackInputProps {
  techStack: TechStack[];
  onAdd: (tech: TechStack) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

interface DevIcon {
  name: string;
  versions: {
    svg: string[];
    font: string[];
  };
}

export function TechStackInput({
  techStack,
  onAdd,
  onRemove,
  disabled,
}: TechStackInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [allIcons, setAllIcons] = useState<DevIcon[]>([]);
  const [openUpward, setOpenUpward] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch devicons list on mount
  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/devicons/devicon/master/devicon.json",
    )
      .then((res) => res.json())
      .then((data) => {
        setAllIcons(data);
      })
      .catch((err) => {
        console.error("Failed to fetch devicons:", err);
      });
  }, []);

  // Filter suggestions based on search term
  const filteredIcons = useMemo(() => {
    if (!inputValue || allIcons.length === 0) {
      return allIcons.slice(0, 50); // Show first 50 by default
    }
    return allIcons
      .filter((icon) =>
        icon.name.toLowerCase().includes(inputValue.toLowerCase()),
      )
      .slice(0, 50);
  }, [inputValue, allIcons]);

  const getIconUrl = (icon: DevIcon): string => {
    let variant = icon.versions.svg[0];

    if (icon.versions.svg.includes("original")) {
      variant = "original";
    } else if (icon.versions.svg.includes("original-wordmark")) {
      variant = "original-wordmark";
    } else if (icon.versions.svg.includes("plain-wordmark")) {
      variant = "plain-wordmark";
    } else if (icon.versions.svg.includes("line")) {
      variant = "line";
    }

    return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${icon.name}/${icon.name}-${variant}.svg`;
  };

  const handleAddTech = (tech: TechStack) => {
    if (techStack.length >= 10) {
      toast.error("Maximum 10 technologies allowed");
      return;
    }

    if (
      techStack.some((t) => t.label.toLowerCase() === tech.label.toLowerCase())
    ) {
      toast.error("Technology already added");
      return;
    }

    onAdd(tech);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleSelectIcon = (icon: DevIcon) => {
    const tech: TechStack = {
      label: icon.name.charAt(0).toUpperCase() + icon.name.slice(1),
      image: getIconUrl(icon),
    };
    handleAddTech(tech);
  };

  const calculateDropdownPosition = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 300; // max-h-[300px]

    // Open upward if not enough space below and more space above
    setOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      // Add custom technology
      const tech: TechStack = {
        label: inputValue.trim(),
      };
      handleAddTech(tech);
    } else if (e.key === "Backspace" && !inputValue && techStack.length > 0) {
      // Remove last tech on backspace when input is empty
      onRemove(techStack.length - 1);
    }
  };

  const handleFocus = () => {
    calculateDropdownPosition();
    setIsOpen(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <Label>
        Tech Stack <span className="text-muted-foreground">(optional)</span>
      </Label>

      <div className="relative" ref={containerRef}>
        {/* Input container with inline tags */}
        <div
          className={cn(
            "dark:bg-input/30 border-input flex min-h-[2.5rem] flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-3 py-2 shadow-xs transition-[color,box-shadow] outline-none",
            "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
            disabled && "pointer-events-none cursor-not-allowed opacity-50",
          )}
        >
          {/* Selected tech stack tags */}
          {techStack.map((tech, index) => (
            <span
              key={index}
              className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm"
            >
              {tech.image && (
                <Image
                  src={tech.image}
                  alt={tech.label}
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5"
                />
              )}
              <span>{tech.label}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="hover:text-destructive rounded-sm transition-colors"
                disabled={disabled}
              >
                <Cross className="h-3 w-3" />
              </button>
            </span>
          ))}

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={
              techStack.length === 0
                ? "Search or type to add technologies..."
                : techStack.length >= 10
                  ? ""
                  : "Add more..."
            }
            disabled={disabled || techStack.length >= 10}
            className="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed"
          />
        </div>

        {/* Dropdown suggestions */}
        <AnimatePresence>
          {isOpen && !disabled && techStack.length < 10 && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: openUpward ? 10 : -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: openUpward ? 10 : -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "absolute z-50 w-full",
                openUpward ? "bottom-full mb-2" : "top-full mt-2",
              )}
            >
              <Command className="rounded-lg border shadow-md">
                <CommandList className="max-h-[300px]">
                  {filteredIcons.length > 0 ? (
                    <CommandGroup>
                      {filteredIcons.map((icon) => {
                        const isSelected = techStack.some(
                          (t) =>
                            t.label.toLowerCase() === icon.name.toLowerCase(),
                        );
                        return (
                          <CommandItem
                            key={icon.name}
                            value={icon.name}
                            onSelect={() => handleSelectIcon(icon)}
                            disabled={isSelected}
                            className={cn(
                              "flex items-center gap-2",
                              isSelected && "opacity-50",
                            )}
                          >
                            <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded">
                              <Image
                                src={getIconUrl(icon)}
                                alt={icon.name}
                                width={16}
                                height={16}
                                className="h-4 w-4"
                              />
                            </div>
                            <span className="flex-1 capitalize">
                              {icon.name}
                            </span>
                            {isSelected && (
                              <Tick className="text-muted-foreground h-4 w-4" />
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ) : (
                    <CommandEmpty>
                      {inputValue ? (
                        <>
                          No matches found. Press{" "}
                          <kbd className="bg-muted rounded border px-1">
                            Enter
                          </kbd>{" "}
                          to add &quot;{inputValue}&quot;
                        </>
                      ) : (
                        "Start typing to search..."
                      )}
                    </CommandEmpty>
                  )}
                </CommandList>
              </Command>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
