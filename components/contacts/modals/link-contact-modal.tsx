"use client";

import { useState } from "react";
import { ModalShell } from "./modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { contactStore, useContacts, VALID_RELATIONSHIP_TYPES, type FullContact, type RelationshipType } from "@/lib/contact-store";
import { cn } from "@/lib/utils";

const AVATAR_BG: Record<string, string> = {
  blue: "bg-decorative-bg-blue text-decorative-fg-blue",
  yellow: "bg-[#fff8e5] text-[#7a5700]",
  green: "bg-[#e5f9f0] text-[#006b44]",
  red: "bg-[#fde8e9] text-[#b0000a]",
};

const TYPE_COLORS: Record<string, string> = {
  "Parent/Guardian": "bg-tag-blue-bg text-tag-blue-fg",
  Student: "bg-tag-teal-bg text-tag-teal-fg",
  Agent: "bg-tag-violet-bg text-tag-violet-fg",
  Recommender: "bg-tag-yellow-bg text-tag-yellow-fg",
  "Feeder School Contact": "bg-[#f0e6ff] text-[#5000b8]",
  General: "bg-[#f0f0f0] text-text-secondary",
};

export function LinkContactModal({ contact, onClose }: { contact: FullContact; onClose: () => void }) {
  const store = useContacts();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FullContact | null>(null);
  const [relType, setRelType] = useState<RelationshipType | "">("");

  const existingRelIds = new Set(store.getRelationships(contact.id).map((r) => r.contact.id));

  const results = search.trim()
    ? store.getAll().filter((c) => {
        if (c.id === contact.id || existingRelIds.has(c.id)) return false;
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      })
    : [];

  const validTypes = selected
    ? (VALID_RELATIONSHIP_TYPES[contact.type]?.[selected.type] ?? [])
    : [];

  function handleLink() {
    if (!selected || !relType) return;
    contactStore.addRelationship(contact.id, selected.id, relType as RelationshipType);
    onClose();
  }

  return (
    <ModalShell
      title="Link contact"
      subtitle={`Add a relationship from ${contact.name} to another contact.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>Cancel</Button>
          <Button size="md" onClick={handleLink} disabled={!selected || !relType}>
            Link contact
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Step 1: search */}
        <div>
          <label className="block text-[12px] font-semibold text-text-primary mb-1.5">
            Search for a contact
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
            <Input
              placeholder="Name or email…"
              value={search}
              onChange={(e) => {
                setSearch((e.target as HTMLInputElement).value);
                setSelected(null);
                setRelType("");
              }}
              className="pl-8 h-9 text-[14px]"
            />
          </div>

          {results.length > 0 && (
            <div className="mt-1 border border-border-secondary rounded-lg overflow-hidden">
              {results.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelected(c); setSearch(c.name); setRelType(""); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#fafafa] transition-colors text-left border-b border-border-secondary last:border-0",
                    selected?.id === c.id && "bg-[#f5f5f5]"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-[4px] flex items-center justify-center text-[11px] font-semibold shrink-0",
                    AVATAR_BG[c.avatarColor ?? "blue"]
                  )}>
                    {c.nameInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-text-primary truncate">{c.name}</p>
                    <p className="text-[11px] text-text-secondary truncate">{c.email}</p>
                  </div>
                  <span className={cn(
                    "text-[11px] px-1.5 py-0.5 rounded-[3px] font-medium shrink-0",
                    TYPE_COLORS[c.type] ?? "bg-[#f0f0f0] text-text-secondary"
                  )}>
                    {c.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: relationship type */}
        {selected && (
          <div>
            <label className="block text-[12px] font-semibold text-text-primary mb-1.5">
              Relationship type
            </label>
            {validTypes.length === 0 ? (
              <p className="text-[13px] text-text-secondary bg-[#fafafa] px-3 py-2 rounded-lg">
                No valid relationship types exist between a {contact.type} and a {selected.type}.
              </p>
            ) : (
              <div className="space-y-1">
                {validTypes.map((type) => (
                  <label
                    key={type}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors",
                      relType === type
                        ? "border-interactive-primary bg-[#fff5f5]"
                        : "border-border-secondary hover:bg-[#fafafa]"
                    )}
                  >
                    <input
                      type="radio"
                      name="relType"
                      value={type}
                      checked={relType === type}
                      onChange={() => setRelType(type)}
                      className="accent-interactive-primary"
                    />
                    <span className="text-[13px] text-text-primary">
                      {contact.name} is <strong>{type}</strong> {selected.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
