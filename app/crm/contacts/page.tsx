"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { ContactsTable, type SortField, type SortDir } from "@/components/contacts/contacts-table";
import { ContactsToolbar, type ContactFilters } from "@/components/contacts/contacts-toolbar";
import { SAMPLE_CONTACTS } from "@/components/contacts/contacts-data";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";

export default function ContactDirectoryPage() {
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters
  const [filters, setFilters] = useState<ContactFilters>({
    search: "",
    types: new Set(),
    scores: new Set(),
  });

  // Sort
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "added",
    dir: "desc",
  });

  // Derived: filtered + sorted rows
  const rows = useMemo(() => {
    let data = [...SAMPLE_CONTACTS];

    // Search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (filters.types.size > 0) {
      data = data.filter((r) => filters.types.has(r.type));
    }

    // Engagement score filter
    if (filters.scores.size > 0) {
      data = data.filter((r) => filters.scores.has(r.engagementScore));
    }

    // Sort
    data.sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "source":
          cmp = a.source.localeCompare(b.source);
          break;
        case "score": {
          const order: Record<string, number> = { Hot: 0, Warm: 1, Cold: 2, Unknown: 3 };
          cmp = (order[a.engagementScore] ?? 99) - (order[b.engagementScore] ?? 99);
          break;
        }
        case "stage":
          cmp = (a.pipelineStage ?? "").localeCompare(b.pipelineStage ?? "");
          break;
        case "added":
          cmp = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [filters, sort]);

  function handleToggleSort(field: SortField) {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" }
    );
  }

  function handleSelectRow(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function handleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(rows.map((r) => r.id)) : new Set());
  }

  const pageHeader = (
    <PageHeader
      title="Contact directory"
      actions={
        <>
          <Button variant="outline" size="md" onClick={() => console.log("Export")}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="md" onClick={() => console.log("Add contact")}>
            <Plus className="w-4 h-4" />
            Add contact
          </Button>
        </>
      }
    />
  );

  return (
    <DashboardLayout pageHeader={pageHeader}>
      <div className="flex flex-col h-full gap-4 pt-4">
        {/* Toolbar */}
        <div className="shrink-0 px-6 bg-white">
          <ContactsToolbar
            filters={filters}
            onFiltersChange={(f) => {
              setFilters(f);
              setSelectedIds(new Set());
            }}
            totalCount={rows.length}
            selectedCount={selectedIds.size}
            onBulkDelete={() => {
              console.log("Delete", [...selectedIds]);
              setSelectedIds(new Set());
            }}
            onClearSelection={() => setSelectedIds(new Set())}
          />
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto bg-white px-6">
          <ContactsTable
            rows={rows}
            selectedIds={selectedIds}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            onRowAction={(id, action) => console.log(action, id)}
            sort={sort}
            onSort={handleToggleSort}
          />
        </div>

        {/* Footer: pagination stub */}
        <div className="shrink-0 px-6 pt-0 pb-4 bg-white flex items-center justify-between">
          <span className="text-[12px] text-text-secondary">
            Showing {rows.length} of {SAMPLE_CONTACTS.length} contacts
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="h-7 px-2.5 text-[12px] rounded border border-border-secondary text-text-secondary disabled:opacity-40"
            >
              Previous
            </button>
            <span className="h-7 min-w-7 px-2.5 inline-flex items-center justify-center text-[12px] rounded border border-interactive-primary text-interactive-primary font-semibold">
              1
            </span>
            <button className="h-7 px-2.5 text-[12px] rounded border border-border-secondary text-text-secondary hover:bg-[#fafafa] transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
