"use client";

import { Search, SlidersHorizontal, Download, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ContactType, EngagementScore } from "./contacts-table";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContactFilters {
  search: string;
  types: Set<ContactType>;
  scores: Set<EngagementScore>;
}

interface ContactsToolbarProps {
  filters: ContactFilters;
  onFiltersChange: (filters: ContactFilters) => void;
  totalCount: number;
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onBulkExport?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_TYPES: ContactType[] = [
  "Parent/Guardian",
  "Student",
  "Agent",
  "Recommender",
  "Feeder School Contact",
  "General",
];

const ALL_SCORES: EngagementScore[] = ["Hot", "Warm", "Cold", "Unknown"];

const SCORE_DOT: Record<EngagementScore, string> = {
  Hot: "bg-[#f04c54]",
  Warm: "bg-[#ff9e2c]",
  Cold: "bg-[#009cad]",
  Unknown: "bg-border-secondary",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ContactsToolbar({
  filters,
  onFiltersChange,
  totalCount,
  selectedCount,
  onBulkDelete,
  onClearSelection,
  onBulkExport,
}: ContactsToolbarProps) {
  const activeFilterCount =
    (filters.types.size > 0 ? 1 : 0) + (filters.scores.size > 0 ? 1 : 0);

  function toggleType(type: ContactType) {
    const next = new Set(filters.types);
    next.has(type) ? next.delete(type) : next.add(type);
    onFiltersChange({ ...filters, types: next });
  }

  function toggleScore(score: EngagementScore) {
    const next = new Set(filters.scores);
    next.has(score) ? next.delete(score) : next.add(score);
    onFiltersChange({ ...filters, scores: next });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: search + filters */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-[320px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
          <Input
            placeholder="Search by name, email, phone…"
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: (e.target as HTMLInputElement).value })
            }
            className="pl-8 h-9 text-[14px]"
          />
        </div>

        {/* Contact type filter */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="md"
                className={cn(filters.types.size > 0 && "border-interactive-primary text-interactive-primary")}
              >
                Contact type
                {filters.types.size > 0 && (
                  <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-interactive-primary text-white">
                    {filters.types.size}
                  </Badge>
                )}
                <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
              </Button>
            }
          />
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel className="text-[12px] font-semibold text-text-secondary">
              Filter by type
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_TYPES.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={filters.types.has(type)}
                onCheckedChange={() => toggleType(type)}
                className="text-[13px]"
              >
                {type}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Engagement score filter */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="md"
                className={cn(filters.scores.size > 0 && "border-interactive-primary text-interactive-primary")}
              >
                Engagement
                {filters.scores.size > 0 && (
                  <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-interactive-primary text-white">
                    {filters.scores.size}
                  </Badge>
                )}
                <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
              </Button>
            }
          />
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel className="text-[12px] font-semibold text-text-secondary">
              Filter by engagement
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_SCORES.map((score) => (
              <DropdownMenuCheckboxItem
                key={score}
                checked={filters.scores.has(score)}
                onCheckedChange={() => toggleScore(score)}
                className="text-[13px]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", SCORE_DOT[score])} />
                  {score}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active filter indicator */}
        {activeFilterCount > 0 && (
          <button
            className="text-[12px] text-interactive-primary hover:underline"
            onClick={() => onFiltersChange({ ...filters, types: new Set(), scores: new Set() })}
          >
            Clear filters
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Advanced filters */}
        <Button variant="ghost" size="md" className="text-text-secondary">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          More filters
        </Button>
      </div>

      {/* Row 2: bulk action bar (only when rows selected) */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-[#f5f5f5] rounded-lg">
          <span className="text-[13px] font-medium text-text-primary">
            {selectedCount} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            Deselect all
          </button>
          <div className="flex-1" />
          <Button variant="outline" size="md" onClick={onBulkExport}>
            <Download className="w-3.5 h-3.5" />
            Export selected
          </Button>
          <Button variant="destructive" size="md" onClick={onBulkDelete}>
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
