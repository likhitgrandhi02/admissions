"use client";

import { useState } from "react";
import { ModalShell } from "./modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactStore, type FullContact, type ContactType, type EngagementScore } from "@/lib/contact-store";
import { cn } from "@/lib/utils";

const ALL_TYPES: ContactType[] = [
  "Parent/Guardian", "Student", "Agent", "Recommender", "Feeder School Contact", "General",
];

export function EditContactModal({ contact, onClose }: { contact: FullContact; onClose: () => void }) {
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email);
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [type, setType] = useState<ContactType>(contact.type);
  const [address, setAddress] = useState(contact.address ?? "");
  const [languagePreference, setLanguagePreference] = useState(contact.languagePreference ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(contact.dateOfBirth ?? "");
  const [yearGroup, setYearGroup] = useState(contact.yearGroup ?? "");
  const [programme, setProgramme] = useState(contact.programme ?? "");

  function handleSave() {
    if (!name.trim() || !email.trim()) return;
    contactStore.update(contact.id, {
      name: name.trim(),
      nameInitial: name.trim()[0]?.toUpperCase() ?? contact.nameInitial,
      email: email.trim(),
      phone: phone.trim() || undefined,
      type,
      address: address.trim() || undefined,
      languagePreference: languagePreference.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      yearGroup: yearGroup.trim() || undefined,
      programme: programme.trim() || undefined,
    });
    onClose();
  }

  return (
    <ModalShell
      title="Edit contact"
      subtitle="Update contact information."
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>Cancel</Button>
          <Button size="md" onClick={handleSave} disabled={!name.trim() || !email.trim()}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Contact type */}
        <div>
          <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Contact type</label>
          <div className="flex flex-wrap gap-2">
            {ALL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] border transition-colors",
                  type === t
                    ? "border-interactive-primary bg-[#fff5f5] text-interactive-primary font-medium"
                    : "border-border-secondary hover:bg-[#fafafa] text-text-primary"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Full name *</label>
            <Input
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
              className="h-9 text-[14px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Email *</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
              className="h-9 text-[14px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Phone</label>
            <Input
              value={phone}
              onChange={(e) => setPhone((e.target as HTMLInputElement).value)}
              className="h-9 text-[14px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Language preference</label>
            <Input
              value={languagePreference}
              onChange={(e) => setLanguagePreference((e.target as HTMLInputElement).value)}
              placeholder="e.g. English"
              className="h-9 text-[14px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Address</label>
          <Input
            value={address}
            onChange={(e) => setAddress((e.target as HTMLInputElement).value)}
            placeholder="Street, city, country"
            className="h-9 text-[14px]"
          />
        </div>

        {/* Student-specific fields */}
        {type === "Student" && (
          <div className="grid grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Date of birth</label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth((e.target as HTMLInputElement).value)}
                className="h-9 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Year group</label>
              <Input
                value={yearGroup}
                onChange={(e) => setYearGroup((e.target as HTMLInputElement).value)}
                placeholder="e.g. Grade 6"
                className="h-9 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Programme</label>
              <Input
                value={programme}
                onChange={(e) => setProgramme((e.target as HTMLInputElement).value)}
                placeholder="e.g. IB"
                className="h-9 text-[14px]"
              />
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
