"use client";

import { useState } from "react";
import { ModalShell } from "./modal-shell";
import { Button } from "@/components/ui/button";
import { contactStore, useContacts, type FullContact } from "@/lib/contact-store";
import { cn } from "@/lib/utils";

export function AddNoteModal({ contact, onClose }: { contact: FullContact; onClose: () => void }) {
  const store = useContacts();
  const [content, setContent] = useState("");
  const [propagateTo, setPropagateTo] = useState<Set<string>>(new Set());

  const relationships = store.getRelationships(contact.id);

  function togglePropagate(id: string) {
    setPropagateTo((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSave() {
    if (!content.trim()) return;
    contactStore.addNote(contact.id, content.trim(), "Current User", [...propagateTo]);
    onClose();
  }

  return (
    <ModalShell
      title="Add note"
      subtitle={`Adding a note to ${contact.name}'s profile.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>Cancel</Button>
          <Button size="md" onClick={handleSave} disabled={!content.trim()}>Save note</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Note</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add your note here…"
            rows={5}
            className="w-full border border-border-secondary rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-interactive-primary/30 focus:border-interactive-primary transition-colors"
          />
        </div>

        {relationships.length > 0 && (
          <div>
            <label className="block text-[12px] font-semibold text-text-primary mb-1.5">
              Also add to linked contacts (optional)
            </label>
            <div className="space-y-1">
              {relationships.map((rel) => (
                <label
                  key={rel.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                    propagateTo.has(rel.contact.id)
                      ? "border-interactive-primary bg-[#fff5f5]"
                      : "border-border-secondary hover:bg-[#fafafa]"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={propagateTo.has(rel.contact.id)}
                    onChange={() => togglePropagate(rel.contact.id)}
                    className="accent-interactive-primary"
                  />
                  <span className="text-[13px] text-text-primary">{rel.contact.name}</span>
                  <span className="text-[11px] text-text-secondary ml-auto">{rel.type}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
