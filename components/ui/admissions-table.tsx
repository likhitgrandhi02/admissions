"use client";

import * as React from "react";
import { MoreVertical, ArrowUpDown, Info, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TagVariant = "teal" | "violet" | "blue" | "yellow";
export type ApplicationStatus = "Application" | "Onboarding" | "Enrolled" | "Waitlisted";

export interface Tag {
  label: string;
  variant: TagVariant;
}

export interface AdmissionsRow {
  id: string;
  name: string;
  nameInitial: string;
  guardian: string;
  guardianAvatarUrl?: string;
  status: ApplicationStatus;
  statusProgress: number; // 0–100
  email: string;
  grade: string;
  staffRep: string;
  staffRepInitial: string;
  tags: Tag[];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Square avatar with coloured initial (Name / Staff Rep columns) */
function SquareAvatar({ initial }: { initial: string }) {
  return (
    <span className="inline-flex items-center justify-center shrink-0 w-7 h-7 rounded-[5px] bg-decorative-bg-blue text-decorative-fg-blue text-[12px] font-semibold leading-none select-none">
      {initial.toUpperCase()}
    </span>
  );
}

/** Circle avatar — photo or fallback initial (Guardian column) */
function CircleAvatar({
  src,
  name,
}: {
  src?: string;
  name: string;
}) {
  const initial = name.charAt(0).toUpperCase();
  return src ? (
    <img
      src={src}
      alt={name}
      className="shrink-0 w-7 h-7 rounded-full object-cover"
    />
  ) : (
    <span className="inline-flex items-center justify-center shrink-0 w-7 h-7 rounded-full bg-decorative-bg-yellow text-text-secondary text-[12px] font-semibold leading-none select-none">
      {initial}
    </span>
  );
}

/** Progress bar for Status column */
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1 rounded-sm bg-border-secondary overflow-hidden">
      <div
        className="h-full rounded-sm bg-interactive-success transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

const tagVariantClasses: Record<TagVariant, string> = {
  teal: "bg-tag-teal-bg text-tag-teal-fg",
  violet: "bg-tag-violet-bg text-tag-violet-fg",
  blue: "bg-tag-blue-bg text-tag-blue-fg",
  yellow: "bg-tag-yellow-bg text-tag-yellow-fg",
};

/** Pill tag */
function Tag({ label, variant }: Tag) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1 py-0.5 rounded-[3px] text-[12px] leading-4 font-medium whitespace-nowrap",
        tagVariantClasses[variant]
      )}
    >
      {label}
    </span>
  );
}

/** Column header cell */
function HeaderCell({
  children,
  className,
  sortable = false,
}: {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
}) {
  return (
    <th
      className={cn(
        "h-11 px-3 text-left align-middle bg-white border-b border-border-secondary",
        "text-[14px] font-semibold leading-5 text-text-primary whitespace-nowrap",
        sortable && "cursor-pointer select-none",
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <ArrowUpDown className="w-3 h-3 text-text-secondary shrink-0" />
        )}
      </span>
    </th>
  );
}

/** Generic body cell wrapper */
function BodyCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "h-11 px-3 align-middle border-b border-border-secondary",
        className
      )}
    >
      {children}
    </td>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────

interface AdmissionsTableProps {
  rows: AdmissionsRow[];
  selectedIds?: Set<string>;
  onSelectRow?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  onRowAction?: (id: string) => void;
  className?: string;
}

export function AdmissionsTable({
  rows,
  selectedIds = new Set(),
  onSelectRow,
  onSelectAll,
  onRowAction,
  className,
}: AdmissionsTableProps) {
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = rows.some((r) => selectedIds.has(r.id));

  return (
    <div className={cn("w-full overflow-x-auto rounded-md border border-border-secondary", className)}>
      <table className="w-full border-collapse text-[14px] leading-5">
        <thead>
          <tr>
            {/* Checkbox */}
            <th className="h-11 w-10 px-3 bg-white border-b border-border-secondary align-middle">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = !allSelected && someSelected;
                }}
                onChange={(e) => onSelectAll?.(e.target.checked)}
                className="w-4 h-4 rounded border-border-secondary accent-interactive-primary cursor-pointer"
              />
            </th>
            <HeaderCell className="min-w-[240px]" sortable>
              Name
            </HeaderCell>
            <HeaderCell className="min-w-[200px]">Guardian</HeaderCell>
            <HeaderCell className="min-w-[208px]" sortable>
              Status
            </HeaderCell>
            <HeaderCell className="min-w-[238px]">Email</HeaderCell>
            <HeaderCell className="min-w-[160px]" sortable>
              Grade
            </HeaderCell>
            <HeaderCell className="min-w-[180px]">Staff Representative</HeaderCell>
            <HeaderCell className="min-w-[160px]">Tags</HeaderCell>
            {/* Actions — no label */}
            <th className="h-11 w-12 bg-white border-b border-border-secondary" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "group transition-colors hover:bg-[#fafafa]",
                selectedIds.has(row.id) && "bg-[#f5f5f5]"
              )}
            >
              {/* Checkbox */}
              <BodyCell className="w-10 bg-background">
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.id)}
                  onChange={(e) => onSelectRow?.(row.id, e.target.checked)}
                  className="w-4 h-4 rounded border-border-secondary accent-interactive-primary cursor-pointer"
                />
              </BodyCell>

              {/* Name */}
              <BodyCell>
                <span className="flex items-center gap-2">
                  <SquareAvatar initial={row.nameInitial} />
                  <span className="font-medium text-text-primary truncate">{row.name}</span>
                </span>
              </BodyCell>

              {/* Guardian */}
              <BodyCell>
                <span className="flex items-center gap-2">
                  <CircleAvatar src={row.guardianAvatarUrl} name={row.guardian} />
                  <span className="text-text-primary truncate">{row.guardian}</span>
                </span>
              </BodyCell>

              {/* Status */}
              <BodyCell>
                <span className="flex flex-col gap-1">
                  <span className="text-text-primary">{row.status}</span>
                  <ProgressBar value={row.statusProgress} />
                </span>
              </BodyCell>

              {/* Email */}
              <BodyCell>
                <span className="text-text-secondary truncate block">{row.email}</span>
              </BodyCell>

              {/* Grade */}
              <BodyCell>
                <span className="text-text-primary">{row.grade}</span>
              </BodyCell>

              {/* Staff Rep */}
              <BodyCell>
                <span className="flex items-center gap-2">
                  <SquareAvatar initial={row.staffRepInitial} />
                  <span className="text-text-primary truncate">{row.staffRep}</span>
                </span>
              </BodyCell>

              {/* Tags */}
              <BodyCell>
                <span className="flex items-center gap-1 flex-wrap">
                  {row.tags.map((tag, i) => (
                    <Tag key={i} {...tag} />
                  ))}
                </span>
              </BodyCell>

              {/* Actions */}
              <BodyCell className="w-12">
                <button
                  onClick={() => onRowAction?.(row.id)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-border-secondary text-text-secondary transition-colors"
                  aria-label="Row actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </BodyCell>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td
                colSpan={9}
                className="h-24 text-center text-text-secondary text-[14px] bg-white"
              >
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sample data ──────────────────────────────────────────────────────────────

export const SAMPLE_ADMISSIONS_ROWS: AdmissionsRow[] = [
  {
    id: "1",
    name: "Ethan Parker",
    nameInitial: "E",
    guardian: "Oliver Stone",
    status: "Application",
    statusProgress: 30,
    email: "ethan.parker@gmail.com",
    grade: "Grade 6",
    staffRep: "Oliver Stone",
    staffRepInitial: "O",
    tags: [{ label: "Intake 2026", variant: "teal" }],
  },
  {
    id: "2",
    name: "Liam Johnson",
    nameInitial: "L",
    guardian: "Lucas Taylor",
    status: "Onboarding",
    statusProgress: 60,
    email: "lisa.jameson@gmail.com",
    grade: "Grade 4",
    staffRep: "Lucas Taylor",
    staffRepInitial: "L",
    tags: [{ label: "Cycle 2025-26", variant: "violet" }],
  },
  {
    id: "3",
    name: "Olivia Smith",
    nameInitial: "O",
    guardian: "Emma Johnson",
    status: "Onboarding",
    statusProgress: 65,
    email: "michael.brown@gmail.com",
    grade: "Grade 5",
    staffRep: "Emma Johnson",
    staffRepInitial: "E",
    tags: [{ label: "Mid-Year Entry", variant: "blue" }],
  },
  {
    id: "4",
    name: "Sophia Brown",
    nameInitial: "S",
    guardian: "Mia Wilson",
    status: "Application",
    statusProgress: 25,
    email: "sophia.wilson@gmail.com",
    grade: "Grade 6",
    staffRep: "Mia Wilson",
    staffRepInitial: "M",
    tags: [{ label: "Transfer Student", variant: "yellow" }],
  },
  {
    id: "5",
    name: "Mason Williams",
    nameInitial: "M",
    guardian: "Logan Smith",
    status: "Application",
    statusProgress: 20,
    email: "olivia.smith@gmail.com",
    grade: "Grade 5",
    staffRep: "Logan Smith",
    staffRepInitial: "L",
    tags: [{ label: "Alumni Network", variant: "teal" }],
  },
  {
    id: "6",
    name: "Ava Davis",
    nameInitial: "A",
    guardian: "Chloe Martinez",
    status: "Application",
    statusProgress: 35,
    email: "noah.johnson@gmail.com",
    grade: "Grade 5",
    staffRep: "Chloe Martinez",
    staffRepInitial: "C",
    tags: [{ label: "Mid-Year Entry", variant: "blue" }],
  },
  {
    id: "7",
    name: "Isabella Garcia",
    nameInitial: "I",
    guardian: "Sophia Rodriguez",
    status: "Onboarding",
    statusProgress: 70,
    email: "ava.martinez@gmail.com",
    grade: "Grade 4",
    staffRep: "Sophia Rodriguez",
    staffRepInitial: "S",
    tags: [{ label: "Mid-Year Entry", variant: "blue" }],
  },
];
