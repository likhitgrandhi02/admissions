"use client";

import * as React from "react";
import { MoreVertical, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ContactType =
  | "Parent/Guardian"
  | "Student"
  | "Agent"
  | "Recommender"
  | "Feeder School Contact"
  | "General";

export type EngagementScore = "Hot" | "Warm" | "Cold" | "Unknown";

export type SortField = "name" | "type" | "source" | "score" | "stage" | "added";
export type SortDir = "asc" | "desc";

export interface ContactTag {
  label: string;
  variant: "teal" | "violet" | "blue" | "yellow" | "gray";
}

export interface ContactRow {
  id: string;
  name: string;
  nameInitial: string;
  avatarColor?: "blue" | "yellow" | "green" | "red";
  type: ContactType;
  email: string;
  phone?: string;
  source: string;
  engagementScore: EngagementScore;
  pipelineStage?: string;
  staffRep?: string;
  staffRepInitial?: string;
  tags: ContactTag[];
  addedAt: string; // ISO date string
}

// ─── Design constants ─────────────────────────────────────────────────────────

const TAG_CLASSES: Record<string, string> = {
  teal: "bg-tag-teal-bg text-tag-teal-fg",
  violet: "bg-tag-violet-bg text-tag-violet-fg",
  blue: "bg-tag-blue-bg text-tag-blue-fg",
  yellow: "bg-tag-yellow-bg text-tag-yellow-fg",
  gray: "bg-[#f0f0f0] text-text-secondary",
};

const AVATAR_BG: Record<string, string> = {
  blue: "bg-decorative-bg-blue text-decorative-fg-blue",
  yellow: "bg-[#fff8e5] text-[#7a5700]",
  green: "bg-[#e5f9f0] text-[#006b44]",
  red: "bg-[#fde8e9] text-[#b0000a]",
};

const SCORE_CONFIG: Record<EngagementScore, { label: string; dot: string; text: string }> = {
  Hot: { label: "Hot", dot: "bg-[#f04c54]", text: "text-[#b0000a]" },
  Warm: { label: "Warm", dot: "bg-[#ff9e2c]", text: "text-[#7a4200]" },
  Cold: { label: "Cold", dot: "bg-[#009cad]", text: "text-[#00616e]" },
  Unknown: { label: "—", dot: "bg-border-secondary", text: "text-text-secondary" },
};

const TYPE_COLORS: Record<ContactType, string> = {
  "Parent/Guardian": "bg-tag-blue-bg text-tag-blue-fg",
  Student: "bg-tag-teal-bg text-tag-teal-fg",
  Agent: "bg-tag-violet-bg text-tag-violet-fg",
  Recommender: "bg-tag-yellow-bg text-tag-yellow-fg",
  "Feeder School Contact": "bg-[#f0e6ff] text-[#5000b8]",
  General: "bg-[#f0f0f0] text-text-secondary",
};

// ─── Small atoms ─────────────────────────────────────────────────────────────

function Avatar({
  initial,
  color = "blue",
}: {
  initial: string;
  color?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 w-7 h-7 rounded-[5px] text-[12px] font-semibold leading-none select-none",
        AVATAR_BG[color] ?? AVATAR_BG.blue
      )}
    >
      {initial.toUpperCase()}
    </span>
  );
}

function Tag({ label, variant }: ContactTag) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1 py-0.5 rounded-[3px] text-[11px] leading-4 font-medium whitespace-nowrap",
        TAG_CLASSES[variant] ?? TAG_CLASSES.gray
      )}
    >
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: ContactType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded-[3px] text-[11px] leading-4 font-medium whitespace-nowrap",
        TYPE_COLORS[type]
      )}
    >
      {type}
    </span>
  );
}

function ScorePill({ score }: { score: EngagementScore }) {
  const cfg = SCORE_CONFIG[score];
  if (score === "Unknown") return <span className="text-text-secondary text-[13px]">—</span>;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-medium", cfg.text)}>
      <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Header cell ─────────────────────────────────────────────────────────────

interface HeaderCellProps {
  children: React.ReactNode;
  field?: SortField;
  currentSort?: { field: SortField; dir: SortDir };
  onSort?: (field: SortField) => void;
  className?: string;
}

function HeaderCell({ children, field, currentSort, onSort, className }: HeaderCellProps) {
  const active = field && currentSort?.field === field;
  const Icon =
    active && currentSort.dir === "asc"
      ? ArrowUp
      : active && currentSort.dir === "desc"
        ? ArrowDown
        : ArrowUpDown;

  return (
    <th
      onClick={field ? () => onSort?.(field) : undefined}
      className={cn(
        "h-11 px-3 py-1 text-left align-middle bg-white border-b border-border-secondary",
        "text-[14px] font-semibold leading-5 text-text-primary whitespace-nowrap select-none",
        field && "cursor-pointer hover:text-text-primary transition-colors",
        active && "text-text-primary",
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {field && (
          <Icon
            className={cn(
              "w-3 h-3 shrink-0 transition-opacity",
              active ? "opacity-100" : "opacity-40"
            )}
          />
        )}
      </span>
    </th>
  );
}

// ─── Main table ───────────────────────────────────────────────────────────────

export interface ContactsTableProps {
  rows: ContactRow[];
  selectedIds?: Set<string>;
  onSelectRow?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  onRowAction?: (id: string, action: string) => void;
  sort?: { field: SortField; dir: SortDir };
  onSort?: (field: SortField) => void;
  className?: string;
}

export function ContactsTable({
  rows,
  selectedIds = new Set(),
  onSelectRow,
  onSelectAll,
  onRowAction,
  sort,
  onSort,
  className,
}: ContactsTableProps) {
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = rows.some((r) => selectedIds.has(r.id));

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse text-[14px] leading-5">
        <thead>
          <tr>
            <th className="h-11 w-10 px-3 py-1 bg-white border-b border-border-secondary align-middle">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = !allSelected && someSelected;
                }}
                onChange={(e) => onSelectAll?.(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-interactive-primary cursor-pointer"
              />
            </th>
            <HeaderCell field="name" currentSort={sort} onSort={onSort} className="min-w-[220px]">
              Name
            </HeaderCell>
            <HeaderCell field="type" currentSort={sort} onSort={onSort} className="min-w-[170px]">
              Contact type
            </HeaderCell>
            <HeaderCell className="min-w-[210px]">Email</HeaderCell>
            <HeaderCell field="source" currentSort={sort} onSort={onSort} className="min-w-[150px]">
              Source
            </HeaderCell>
            <HeaderCell field="score" currentSort={sort} onSort={onSort} className="min-w-[110px]">
              Engagement
            </HeaderCell>
            <HeaderCell field="stage" currentSort={sort} onSort={onSort} className="min-w-[150px]">
              Pipeline stage
            </HeaderCell>
            <HeaderCell className="min-w-[100px]">Tags</HeaderCell>
            <HeaderCell field="added" currentSort={sort} onSort={onSort} className="min-w-[110px]">
              Added
            </HeaderCell>
            <th className="h-11 w-12 px-3 py-1 bg-white border-b border-border-secondary" />
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "transition-colors hover:bg-[#fafafa]",
                selectedIds.has(row.id) && "bg-[#f5f5f5]"
              )}
            >
              {/* Checkbox */}
              <td className="h-11 w-10 px-3 py-1 border-b border-border-secondary align-middle bg-background">
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.id)}
                  onChange={(e) => onSelectRow?.(row.id, e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-interactive-primary cursor-pointer"
                />
              </td>

              {/* Name */}
              <td className="h-11 px-3 py-1 border-b border-border-secondary align-middle">
                <span className="flex items-center gap-2">
                  <Avatar initial={row.nameInitial} color={row.avatarColor} />
                  <span>
                    <span className="font-medium text-text-primary block leading-5 truncate max-w-[160px]">
                      {row.name}
                    </span>
                    {row.phone && (
                      <span className="text-[11px] text-text-secondary leading-4 block">
                        {row.phone}
                      </span>
                    )}
                  </span>
                </span>
              </td>

              {/* Contact type */}
              <td className="h-11 px-3 py-1 border-b border-border-secondary align-middle">
                <TypeBadge type={row.type} />
              </td>

              {/* Email */}
              <td className="h-11 px-3 py-1 border-b border-border-secondary align-middle">
                <span className="text-text-secondary truncate block max-w-[200px]">{row.email}</span>
              </td>

              {/* Source */}
              <td className="h-11 px-3 py-1 border-b border-border-secondary align-middle">
                <span className="text-text-primary">{row.source}</span>
              </td>

              {/* Engagement score */}
              <td className="h-11 px-3 py-1 border-b border-border-secondary align-middle">
                <ScorePill score={row.engagementScore} />
              </td>

              {/* Pipeline stage */}
              <td className="h-11 px-3 py-1 border-b border-border-secondary align-middle">
                {row.pipelineStage ? (
                  <span className="text-text-primary">{row.pipelineStage}</span>
                ) : (
                  <span className="text-text-secondary">—</span>
                )}
              </td>

              {/* Tags */}
              <td className="h-11 px-3 py-1 border-b border-border-secondary align-middle">
                <span className="flex items-center gap-1 flex-wrap">
                  {row.tags.map((t, i) => (
                    <Tag key={i} {...t} />
                  ))}
                  {row.tags.length === 0 && <span className="text-text-secondary">—</span>}
                </span>
              </td>

              {/* Added date */}
              <td className="h-11 px-3 py-1 border-b border-border-secondary align-middle">
                <span className="text-text-secondary">
                  {new Date(row.addedAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </td>

              {/* Row actions */}
              <td className="h-11 w-12 px-2 py-1 border-b border-border-secondary align-middle">
                <button
                  onClick={() => onRowAction?.(row.id, "menu")}
                  className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-border-secondary text-text-secondary transition-colors"
                  aria-label="Contact actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td
                colSpan={10}
                className="h-32 text-center align-middle bg-white text-text-secondary text-[14px]"
              >
                No contacts found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
