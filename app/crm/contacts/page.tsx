"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { ContactsTable, type SortField, type SortDir } from "@/components/contacts/contacts-table";
import { ContactsToolbar, type ContactFilters } from "@/components/contacts/contacts-toolbar";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";
import { useContacts } from "@/lib/contact-store";
import { CreateContactModal } from "@/components/contacts/modals/create-contact-modal";
import { ExportContactsModal } from "@/components/contacts/modals/export-contacts-modal";

export default function ContactDirectoryPage() {
  const router = useRouter();
  const store = useContacts();

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

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // All contacts from store
  const allContacts = store.getAll();

  // Derived: filtered + sorted rows
  const rows = useMemo(() => {
    let data = [...allContacts];

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
  }, [allContacts, filters, sort]);

  // Export scope: selected contacts, or all filtered rows if nothing selected
  const exportContacts = selectedIds.size > 0
    ? rows.filter((r) => selectedIds.has(r.id))
    : rows;

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

  function handleRowAction(id: string, action: string) {
    switch (action) {
      case "view":
        router.push(`/crm/contacts/${id}`);
        break;
      case "merge":
        router.push(`/crm/contacts/${id}/merge`);
        break;
      case "archive":
        if (confirm("Archive this contact?")) {
          store.archive(id);
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
        break;
    }
  }

  const pageHeader = (
    <PageHeader
      title="Contact directory"
      actions={
        <>
          <Button variant="outline" size="md" onClick={() => router.push("/crm/contacts/import")}>
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="outline" size="md" onClick={() => setShowExport(true)}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="md" onClick={() => setShowCreate(true)}>
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
              if (confirm(`Archive ${selectedIds.size} contacts?`)) {
                [...selectedIds].forEach((id) => store.archive(id));
                setSelectedIds(new Set());
              }
            }}
            onClearSelection={() => setSelectedIds(new Set())}
            onBulkExport={() => setShowExport(true)}
          />
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto bg-white px-6">
          <ContactsTable
            rows={rows}
            selectedIds={selectedIds}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            onRowClick={(id) => router.push(`/crm/contacts/${id}`)}
            onRowAction={handleRowAction}
            sort={sort}
            onSort={handleToggleSort}
          />
        </div>

        {/* Footer: pagination stub */}
        <div className="shrink-0 px-6 pt-0 pb-4 bg-white flex items-center justify-between">
          <span className="text-[12px] text-text-secondary">
            Showing {rows.length} of {allContacts.length} contacts
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

      {/* Modals */}
      {showCreate && <CreateContactModal onClose={() => setShowCreate(false)} />}
      {showExport && (
        <ExportContactsModal
          contacts={exportContacts}
          onClose={() => setShowExport(false)}
        />
      )}
    </DashboardLayout>
  );
}
