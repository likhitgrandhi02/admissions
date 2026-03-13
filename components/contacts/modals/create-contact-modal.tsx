"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModalShell } from "./modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  contactStore,
  useContacts,
  type FullContact,
  type ContactType,
  type EngagementScore,
  VALID_RELATIONSHIP_TYPES,
  type RelationshipType,
} from "@/lib/contact-store";
import { cn } from "@/lib/utils";
import { Search, AlertTriangle, CheckCircle2 } from "lucide-react";

type Step = "type" | "fields" | "duplicate" | "link";

const ALL_TYPES: ContactType[] = [
  "Parent/Guardian", "Student", "Agent", "Recommender", "Feeder School Contact", "General",
];

const TYPE_DESCRIPTIONS: Record<ContactType, string> = {
  "Parent/Guardian": "A parent or guardian of a student applicant.",
  Student: "A student who is applying or has applied.",
  Agent: "An education agent or consultancy.",
  Recommender: "A teacher, counsellor, or referee.",
  "Feeder School Contact": "A contact at a feeder or partner school.",
  General: "A custom or uncategorised contact.",
};

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

const AVATAR_COLORS = ["blue", "yellow", "green", "red"] as const;

export function CreateContactModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const store = useContacts();

  const [step, setStep] = useState<Step>("type");
  const [type, setType] = useState<ContactType>("Parent/Guardian");

  // Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [languagePreference, setLanguagePreference] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [programme, setProgramme] = useState("");

  // Duplicate check state
  const [duplicates, setDuplicates] = useState<FullContact[]>([]);
  const [dupeChoice, setDupeChoice] = useState<"merge" | "create" | null>(null);
  const [dupeTarget, setDupeTarget] = useState<FullContact | null>(null);

  // Link step
  const [linkSearch, setLinkSearch] = useState("");
  const [linkTarget, setLinkTarget] = useState<FullContact | null>(null);
  const [linkType, setLinkType] = useState<RelationshipType | "">("");

  // Avatar color (deterministic based on name)
  const avatarColor = AVATAR_COLORS[(name.length % AVATAR_COLORS.length) as number] ?? "blue";

  function goToFields() {
    setStep("fields");
  }

  function handleFieldsNext() {
    if (!name.trim() || !email.trim()) return;

    // Build temp contact for duplicate check
    const temp = {
      id: "__temp__",
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      type,
      nameInitial: name.trim()[0]?.toUpperCase() ?? "?",
      avatarColor,
      source: "Manual entry",
      engagementScore: "Unknown" as EngagementScore,
      tags: [],
      addedAt: new Date().toISOString().slice(0, 10),
      status: "Active" as const,
      notes: [],
      tasks: [],
      attributions: [],
      timeline: [],
      engagementScoreValue: 0,
    } satisfies FullContact;

    const found = contactStore.findPotentialDuplicates(temp);
    setDuplicates(found);
    if (found.length > 0) {
      setStep("duplicate");
    } else {
      setStep("link");
    }
  }

  function handleDupeNext() {
    if (dupeChoice === "merge" && dupeTarget) {
      // Navigate to merge page with target
      onClose();
      router.push(`/crm/contacts/${dupeTarget.id}/merge?with=__new__&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
      return;
    }
    setStep("link");
  }

  function handleCreate() {
    const newContact = contactStore.create({
      name: name.trim(),
      nameInitial: name.trim()[0]?.toUpperCase() ?? "?",
      avatarColor,
      type,
      email: email.trim(),
      phone: phone.trim() || undefined,
      languagePreference: languagePreference.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      yearGroup: yearGroup.trim() || undefined,
      programme: programme.trim() || undefined,
      source: "Manual entry",
      engagementScore: "Unknown",
      tags: [],
      addedAt: new Date().toISOString().slice(0, 10),
      status: "Active",
    });

    // Add relationship if chosen
    if (linkTarget && linkType) {
      contactStore.addRelationship(newContact.id, linkTarget.id, linkType as RelationshipType);
    }

    onClose();
    router.push(`/crm/contacts/${newContact.id}`);
  }

  const linkResults = linkSearch.trim()
    ? store.getAll().filter((c) => {
        const q = linkSearch.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      })
    : [];

  const validLinkTypes = linkTarget
    ? (VALID_RELATIONSHIP_TYPES[type]?.[linkTarget.type] ?? [])
    : [];

  const stepTitles: Record<Step, string> = {
    type: "New contact",
    fields: `New ${type}`,
    duplicate: "Potential duplicates found",
    link: "Link to a family member",
  };

  const stepSubtitles: Record<Step, string> = {
    type: "What kind of contact are you adding?",
    fields: "Fill in the contact's details.",
    duplicate: "We found contacts that may already exist. How would you like to proceed?",
    link: "Optionally link this contact to an existing contact.",
  };

  return (
    <ModalShell
      title={stepTitles[step]}
      subtitle={stepSubtitles[step]}
      onClose={onClose}
      width="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5">
            {(["type", "fields", "duplicate", "link"] as Step[])
              .filter((s) => s !== "duplicate" || duplicates.length > 0)
              .map((s, i, arr) => (
                <span
                  key={s}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    s === step ? "bg-interactive-primary" :
                    arr.indexOf(s) < arr.indexOf(step) ? "bg-border-bold-secondary" : "bg-border-secondary"
                  )}
                />
              ))}
          </div>

          <div className="flex gap-2">
            {step !== "type" && (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  if (step === "fields") setStep("type");
                  else if (step === "duplicate") setStep("fields");
                  else if (step === "link") setStep(duplicates.length > 0 ? "duplicate" : "fields");
                }}
              >
                Back
              </Button>
            )}
            <Button variant="outline" size="md" onClick={onClose}>Cancel</Button>
            {step === "type" && (
              <Button size="md" onClick={goToFields}>Continue</Button>
            )}
            {step === "fields" && (
              <Button size="md" onClick={handleFieldsNext} disabled={!name.trim() || !email.trim()}>
                Continue
              </Button>
            )}
            {step === "duplicate" && (
              <Button
                size="md"
                onClick={handleDupeNext}
                disabled={!dupeChoice || (dupeChoice === "merge" && !dupeTarget)}
              >
                {dupeChoice === "merge" ? "Go to merge" : "Create anyway"}
              </Button>
            )}
            {step === "link" && (
              <Button size="md" onClick={handleCreate}>
                {linkTarget && linkType ? "Create & link" : "Create contact"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Step: type */}
      {step === "type" && (
        <div className="space-y-2">
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-colors",
                type === t
                  ? "border-interactive-primary bg-[#fff5f5]"
                  : "border-border-secondary hover:bg-[#fafafa]"
              )}
            >
              <div className="mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors"
                style={{ borderColor: type === t ? "var(--interactive-primary)" : "var(--border-secondary)" }}>
                {type === t && <span className="w-2 h-2 rounded-full bg-interactive-primary" />}
              </div>
              <div>
                <p className="text-[13px] font-medium text-text-primary">{t}</p>
                <p className="text-[12px] text-text-secondary">{TYPE_DESCRIPTIONS[t]}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step: fields */}
      {step === "fields" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Full name *</label>
              <Input
                value={name}
                onChange={(e) => setName((e.target as HTMLInputElement).value)}
                placeholder="e.g. Sarah Parker"
                className="h-9 text-[14px]"
                autoFocus
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Email *</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder="email@example.com"
                className="h-9 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Phone</label>
              <Input
                value={phone}
                onChange={(e) => setPhone((e.target as HTMLInputElement).value)}
                placeholder="+1 (555) 000-0000"
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
      )}

      {/* Step: duplicate */}
      {step === "duplicate" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-[#fff8e5] border border-[#ffeebf] rounded-lg">
            <AlertTriangle className="w-4 h-4 text-[#7a4200] shrink-0 mt-0.5" />
            <p className="text-[13px] text-[#7a4200]">
              We found {duplicates.length} contact{duplicates.length > 1 ? "s" : ""} that may already exist in your directory.
            </p>
          </div>

          <div className="space-y-2">
            {duplicates.map((d) => (
              <div
                key={d.id}
                className={cn(
                  "border rounded-lg p-3 transition-colors",
                  dupeTarget?.id === d.id && dupeChoice === "merge"
                    ? "border-interactive-primary bg-[#fff5f5]"
                    : "border-border-secondary"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-[5px] flex items-center justify-center text-[12px] font-semibold shrink-0",
                    AVATAR_BG[d.avatarColor ?? "blue"]
                  )}>
                    {d.nameInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-text-primary">{d.name}</p>
                    <p className="text-[11px] text-text-secondary">{d.email} · Added {new Date(d.addedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                  <span className={cn(
                    "text-[11px] px-1.5 py-0.5 rounded-[3px] font-medium",
                    TYPE_COLORS[d.type] ?? "bg-[#f0f0f0] text-text-secondary"
                  )}>
                    {d.type}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant={dupeTarget?.id === d.id && dupeChoice === "merge" ? "default" : "outline"}
                    onClick={() => { setDupeTarget(d); setDupeChoice("merge"); }}
                    className="text-[12px]"
                  >
                    Merge with this
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setDupeChoice("create"); setDupeTarget(null); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors",
              dupeChoice === "create"
                ? "border-interactive-primary bg-[#fff5f5]"
                : "border-border-secondary hover:bg-[#fafafa]"
            )}
          >
            <div className="mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors"
              style={{ borderColor: dupeChoice === "create" ? "var(--interactive-primary)" : "var(--border-secondary)" }}>
              {dupeChoice === "create" && <span className="w-2 h-2 rounded-full bg-interactive-primary" />}
            </div>
            <div>
              <p className="text-[13px] font-medium text-text-primary">Create anyway</p>
              <p className="text-[12px] text-text-secondary">These are different people — create a new record.</p>
            </div>
          </button>
        </div>
      )}

      {/* Step: link */}
      {step === "link" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
            <Input
              placeholder="Search for a parent, student, or other contact…"
              value={linkSearch}
              onChange={(e) => {
                setLinkSearch((e.target as HTMLInputElement).value);
                setLinkTarget(null);
                setLinkType("");
              }}
              className="pl-8 h-9 text-[14px]"
            />
          </div>

          {linkResults.length > 0 && (
            <div className="border border-border-secondary rounded-lg overflow-hidden">
              {linkResults.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setLinkTarget(c); setLinkSearch(c.name); setLinkType(""); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#fafafa] transition-colors text-left border-b border-border-secondary last:border-0",
                    linkTarget?.id === c.id && "bg-[#f5f5f5]"
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

          {linkTarget && (
            <div>
              <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Relationship type</label>
              {validLinkTypes.length === 0 ? (
                <p className="text-[13px] text-text-secondary bg-[#fafafa] px-3 py-2 rounded-lg">
                  No valid relationship types between a {type} and a {linkTarget.type}.
                </p>
              ) : (
                <div className="space-y-1">
                  {validLinkTypes.map((t) => (
                    <label
                      key={t}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors",
                        linkType === t
                          ? "border-interactive-primary bg-[#fff5f5]"
                          : "border-border-secondary hover:bg-[#fafafa]"
                      )}
                    >
                      <input
                        type="radio"
                        name="linkType"
                        value={t}
                        checked={linkType === t}
                        onChange={() => setLinkType(t)}
                        className="accent-interactive-primary"
                      />
                      <span className="text-[13px] text-text-primary">
                        {name || "This contact"} is <strong>{t}</strong> {linkTarget.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {!linkSearch && (
            <p className="text-[12px] text-text-secondary">
              Skip this step to create the contact without any relationship links. You can always add relationships later from the contact's profile.
            </p>
          )}
        </div>
      )}
    </ModalShell>
  );
}
