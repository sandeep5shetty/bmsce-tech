"use client";

import { useCallback, useState } from "react";

import { usePathname, useSearchParams } from "next/navigation";

import { useRouter } from "@bprogress/next";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Card from "@/components/icons/card";
import SortDown from "@/components/icons/sort-down";
import SortUp from "@/components/icons/sort-up";
import Table from "@/components/icons/table";

import { Search } from "@/components/icons";

interface SearchAndFilterProps {
  onSearchChange?: (value: string) => void;
  onSortChange?: (sortBy: string, sortDirection: "asc" | "desc") => void;
  onViewChange?: (view: "card" | "table") => void;
  onFilterChange?: (filter: "reviewed" | "pending") => void;
  isOwner: boolean;
}

const SearchAndFilter = ({
  onSearchChange,
  onSortChange,
  onViewChange,
  onFilterChange,
  isOwner,
}: SearchAndFilterProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    (searchParams.get("sortDir") as "asc" | "desc") || "desc",
  );
  const [view, setView] = useState<"card" | "table">(
    (searchParams.get("view") as "card" | "table") || "card",
  );
  const [filter, setFilter] = useState<"reviewed" | "pending">(
    (searchParams.get("filter") as "reviewed" | "pending") || "reviewed",
  );

  // Update URL params
  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Debounced search
  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateUrlParams({ search: value || null });
    onSearchChange?.(value);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateUrlParams({ sortBy: value });
    onSortChange?.(value, sortDirection);
  };

  const toggleSortDirection = () => {
    const newDirection = sortDirection === "asc" ? "desc" : "asc";
    setSortDirection(newDirection);
    updateUrlParams({ sortDir: newDirection });
    onSortChange?.(sortBy, newDirection);
  };

  const handleViewChange = (newView: "card" | "table") => {
    setView(newView);
    updateUrlParams({ view: newView });
    onViewChange?.(newView);
  };

  const handleFilterChange = (newFilter: "reviewed" | "pending") => {
    setFilter(newFilter);
    updateUrlParams({ filter: newFilter });
    onFilterChange?.(newFilter);
  };

  return (
    <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
      <div className="flex w-full flex-row gap-2 sm:w-auto">
        <InputGroup className="w-full max-w-md">
          <InputGroupAddon>
            <Search className="h-4 w-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={handleSearchChange}
          />
        </InputGroup>

        <Select
          value={sortBy}
          onValueChange={handleSortChange}
          disabled={filter === "pending"}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date Reviewed</SelectItem>
            <SelectItem value="rating">Overall Rating</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={"outline"}
          size={"icon"}
          onClick={toggleSortDirection}
          disabled={filter === "pending"}
        >
          {sortDirection === "desc" ? <SortDown /> : <SortUp />}
        </Button>
      </div>
      <div className="flex gap-2">
        {isOwner && (
          <div className="corner-squircle flex items-center space-x-1 rounded-md border p-1 supports-[corner-shape:squircle]:rounded-2xl">
            <Button
              variant={"ghost"}
              size={"sm"}
              className={filter === "reviewed" ? "bg-muted" : ""}
              onClick={() => handleFilterChange("reviewed")}
            >
              Reviewed
            </Button>
            <Button
              variant={"ghost"}
              size={"sm"}
              className={filter === "pending" ? "bg-muted" : ""}
              onClick={() => handleFilterChange("pending")}
            >
              Pending
            </Button>
          </div>
        )}
        <div className="corner-squircle flex items-center space-x-1 rounded-md border p-1 supports-[corner-shape:squircle]:rounded-2xl">
          <Button
            variant={"ghost"}
            size={"icon-sm"}
            className={view === "table" ? "bg-muted" : ""}
            onClick={() => handleViewChange("table")}
          >
            <Table />
          </Button>
          <Button
            variant={"ghost"}
            size={"icon-sm"}
            className={view === "card" ? "bg-muted" : ""}
            onClick={() => handleViewChange("card")}
          >
            <Card />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilter;
