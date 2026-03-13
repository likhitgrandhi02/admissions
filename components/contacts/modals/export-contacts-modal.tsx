"use client";

import { useState } from "react";
import { ModalShell } from "./modal-shell";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2 } from "lucide-react";
import type { FullContact } from "@/lib/contact-store";
import { cn } from "@/lib/utils";

type ColumnKey = "name" | "email" | "phone" | "type" | "source" | "engagementScore" | "pipelineStage" | "tags" | "addedAt" | "staffRep";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "type", label: "Contact type" },
  { key: "source", label: "Source" },
  { key: "engagementScore", label: "Engagement" },
  { key: "pipelineStage", label: "Pipeline stage" },
  { key: "tags", label: "Tags" },
  { key: "addedAt", label: "Added date" },
  { key: "staffRep", label: "Staff owner" },
];

const DEFAULT_COLUMNS: Set<ColumnKey> = new Set(["name", "email", "phone", "type", "source", "engagementScore", "addedAt"]);

export function ExportContactsModal({
  contacts,
  onClose,
}: {
  contacts: FullContact[];
  onClose: () => void;
}) {
  const [selectedCols, setSelectedCols] = useState<Set<ColumnKey>>(new Set(DEFAULT_COLUMNS));
  const [done, setDone] = useState(false);

  function toggleCol(key: ColumnKey) {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function buildCSV(): string {
    const cols = ALL_COLUMNS.filter((c) => selectedCols.has(c.key));
    const header = cols.map((c) => c.label).join(",");
    const rows = contacts.map((contact) =>
      cols.map((c) => {
        let val: string;
        switch (c.key) {
          case "name": val = contact.name; break;
          case "email": val = contact.email; break;
          case "phone": val = contact.phone ?? ""; break;
          case "type": val = contact.type; break;
          case "source": val = contact.source; break;
          case "engagementScore": val = contact.engagementScore; break;
          case "pipelineStage": val = contact.pipelineStage ?? ""; break;
          case "tags": val = contact.tags.map((t) => t.label).join("; "); break;
          case "addedAt": val = contact.addedAt; break;
          case "staffRep": val = contact.staffRep ?? ""; break;
          default: val = "";
        }
        // Escape commas and quotes
        if (val.includes(",") || val.includes('"')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(",")
    );
    return [header, ...rows].join("\n");
  }

  function handleExport() {
    const csv = buildCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDone(true);
  }

  if (done) {
    return (
      <ModalShell
        title="Export complete"
        onClose={onClose}
        footer={<Button size="md" onClick={onClose}>Close</Button>}
      >
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle2 className="w-10 h-10 text-[#008768]" />
          <p className="text-[14px] font-medium text-text-primary">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""} exported successfully.
          </p>
          <p className="text-[12px] text-text-secondary">Check your downloads folder.</p>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title="Export contacts"
      subtitle={`Exporting ${contacts.length} contact${contacts.length !== 1 ? "s" : ""}.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>Cancel</Button>
          <Button size="md" onClick={handleExport} disabled={selectedCols.size === 0}>
            <Download className="w-4 h-4" />
            Download CSV
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-[13px] text-text-secondary">
          Select which columns to include in the export.
        </p>

        <div className="space-y-1">
          {ALL_COLUMNS.map((col) => (
            <label
              key={col.key}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                selectedCols.has(col.key)
                  ? "border-interactive-primary bg-[#fff5f5]"
                  : "border-border-secondary hover:bg-[#fafafa]"
              )}
            >
              <input
                type="checkbox"
                checked={selectedCols.has(col.key)}
                onChange={() => toggleCol(col.key)}
                className="accent-interactive-primary"
              />
              <span className="text-[13px] text-text-primary">{col.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            className="text-[12px] text-interactive-primary hover:underline"
            onClick={() => setSelectedCols(new Set(ALL_COLUMNS.map((c) => c.key)))}
          >
            Select all
          </button>
          <span className="text-[12px] text-text-secondary">·</span>
          <button
            className="text-[12px] text-interactive-primary hover:underline"
            onClick={() => setSelectedCols(new Set())}
          >
            Deselect all
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
