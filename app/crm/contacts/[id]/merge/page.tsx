"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useContacts, contactStore, type FullContact, type ContactType } from "@/lib/contact-store";
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

type MergeStep = "select" | "resolve" | "confirm";

type FieldKey = "name" | "email" | "phone" | "type" | "address" | "languagePreference" | "pipelineStage" | "staffRep";

const FIELD_LABELS: Record<FieldKey, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  type: "Contact type",
  address: "Address",
  languagePreference: "Language preference",
  pipelineStage: "Pipeline stage",
  staffRep: "Staff owner",
};

function getContactFields(c: FullContact): Record<FieldKey, string | undefined> {
  return {
    name: c.name,
    email: c.email,
    phone: c.phone,
    type: c.type,
    address: c.address,
    languagePreference: c.languagePreference,
    pipelineStage: c.pipelineStage,
    staffRep: c.staffRep,
  };
}

export default function MergeContactPage() {
  const params = useParams();
  const router = useRouter();
  const store = useContacts();
  const primaryId = params.id as string;
  const primaryContact = store.getById(primaryId);

  const [step, setStep] = useState<MergeStep>("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [secondary, setSecondary] = useState<FullContact | null>(null);
  const [primaryChosen, setPrimaryChosen] = useState<"primary" | "secondary">("primary");

  // Field resolution: for each field, which contact's value to keep
  const [fieldChoices, setFieldChoices] = useState<Record<FieldKey, "primary" | "secondary">>({
    name: "primary", email: "primary", phone: "primary", type: "primary",
    address: "primary", languagePreference: "primary", pipelineStage: "primary", staffRep: "primary",
  });

  const [merged, setMerged] = useState(false);

  if (!primaryContact) {
    return (
      <DashboardLayout pageHeader={<PageHeader title="Contact not found" />}>
        <div className="flex items-center justify-center h-full text-text-secondary">Contact not found.</div>
      </DashboardLayout>
    );
  }

  const searchResults = searchQuery.trim()
    ? store.getAll().filter((c) => {
        if (c.id === primaryId) return false;
        if (c.type !== primaryContact.type) return false; // same type only
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      })
    : [];

  const effectivePrimary = primaryChosen === "primary" ? primaryContact : secondary;
  const effectiveSecondary = primaryChosen === "primary" ? secondary : primaryContact;

  const conflictingFields: FieldKey[] = secondary
    ? (Object.keys(FIELD_LABELS) as FieldKey[]).filter((key) => {
        const pVal = getContactFields(primaryContact)[key];
        const sVal = getContactFields(secondary)[key];
        return pVal && sVal && pVal !== sVal;
      })
    : [];

  function buildMergedContact(): Partial<FullContact> {
    if (!effectivePrimary || !effectiveSecondary || !primaryContact) return {};

    const resolved: Partial<FullContact> = {};
    (Object.keys(FIELD_LABELS) as FieldKey[]).forEach((key) => {
      const keep = fieldChoices[key];
      const val = keep === "primary"
        ? getContactFields(primaryContact)[key]
        : secondary ? getContactFields(secondary)[key] : undefined;
      if (val !== undefined) {
        (resolved as Record<string, unknown>)[key] = val;
      }
    });
    return resolved;
  }

  function handleConfirmMerge() {
    if (!effectivePrimary || !effectiveSecondary) return;
    const resolvedFields = buildMergedContact();
    contactStore.merge(effectivePrimary.id, effectiveSecondary.id, resolvedFields);
    setMerged(true);
    setTimeout(() => router.push(`/crm/contacts/${effectivePrimary.id}`), 1500);
  }

  if (merged) {
    return (
      <DashboardLayout pageHeader={<PageHeader title="Merge complete" />}>
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <CheckCircle2 className="w-12 h-12 text-[#008768]" />
          <p className="text-[15px] font-semibold text-text-primary">Contacts merged successfully</p>
          <p className="text-[13px] text-text-secondary">Redirecting to the surviving contact…</p>
        </div>
      </DashboardLayout>
    );
  }

  const pageHeader = (
    <PageHeader
      title="Merge contacts"
      actions={
        <Button variant="outline" size="md" onClick={() => router.push(`/crm/contacts/${primaryId}`)}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      }
    />
  );

  return (
    <DashboardLayout pageHeader={pageHeader}>
      <div className="p-6 max-w-4xl mx-auto">

        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {([
            { key: "select", label: "Select duplicate" },
            { key: "resolve", label: "Resolve conflicts" },
            { key: "confirm", label: "Confirm merge" },
          ] as { key: MergeStep; label: string }[]).map((s, i, arr) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium",
                step === s.key
                  ? "bg-interactive-primary text-white"
                  : arr.findIndex((a) => a.key === step) > i
                    ? "bg-[#e5f9f0] text-[#006b44]"
                    : "bg-[#f0f0f0] text-text-secondary"
              )}>
                <span>{i + 1}. {s.label}</span>
              </div>
              {i < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select */}
        {step === "select" && (
          <div className="space-y-5">
            {/* Primary card */}
            <div className="bg-white border border-border-secondary rounded-xl p-5">
              <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wide mb-3">Primary contact (will survive)</p>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-[14px] font-bold shrink-0",
                  AVATAR_BG[primaryContact.avatarColor ?? "blue"]
                )}>
                  {primaryContact.nameInitial}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text-primary">{primaryContact.name}</p>
                  <p className="text-[12px] text-text-secondary">{primaryContact.email}</p>
                </div>
                <span className={cn(
                  "ml-auto text-[11px] px-1.5 py-0.5 rounded-[3px] font-medium",
                  TYPE_COLORS[primaryContact.type]
                )}>
                  {primaryContact.type}
                </span>
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="block text-[12px] font-semibold text-text-primary mb-1.5">
                Search for the duplicate contact
              </label>
              <p className="text-[12px] text-text-secondary mb-2">Only showing contacts of the same type ({primaryContact.type}).</p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
                <Input
                  placeholder="Name or email…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery((e.target as HTMLInputElement).value);
                    setSecondary(null);
                  }}
                  className="pl-8 h-9 text-[14px]"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 border border-border-secondary rounded-lg overflow-hidden">
                  {searchResults.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSecondary(c)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#fafafa] transition-colors text-left border-b border-border-secondary last:border-0",
                        secondary?.id === c.id && "bg-[#f5f5f5]"
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
                      {secondary?.id === c.id && <CheckCircle2 className="w-4 h-4 text-interactive-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {secondary && (
              <div>
                <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Which record should survive?</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: "primary" as const, contact: primaryContact, label: "Keep this as primary" },
                    { key: "secondary" as const, contact: secondary, label: "Keep this as primary" },
                  ]).map(({ key, contact: c, label }) => (
                    <button
                      key={key}
                      onClick={() => setPrimaryChosen(key)}
                      className={cn(
                        "flex flex-col gap-2 p-3 rounded-lg border text-left transition-colors",
                        primaryChosen === key
                          ? "border-interactive-primary bg-[#fff5f5]"
                          : "border-border-secondary hover:bg-[#fafafa]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center"
                          style={{ borderColor: primaryChosen === key ? "var(--interactive-primary)" : "var(--border-secondary)" }}>
                          {primaryChosen === key && <span className="w-1.5 h-1.5 rounded-full bg-interactive-primary" />}
                        </div>
                        <span className="text-[11px] text-text-secondary">{label}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-5">
                        <div className={cn(
                          "w-7 h-7 rounded-[4px] flex items-center justify-center text-[11px] font-semibold shrink-0",
                          AVATAR_BG[c.avatarColor ?? "blue"]
                        )}>
                          {c.nameInitial}
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-text-primary truncate">{c.name}</p>
                          <p className="text-[11px] text-text-secondary truncate">{c.email}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="md" onClick={() => router.push(`/crm/contacts/${primaryId}`)}>
                Cancel
              </Button>
              <Button
                size="md"
                disabled={!secondary}
                onClick={() => {
                  if (conflictingFields.length > 0) {
                    setStep("resolve");
                  } else {
                    setStep("confirm");
                  }
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Resolve conflicts */}
        {step === "resolve" && secondary && effectivePrimary && effectiveSecondary && (
          <div className="space-y-5">
            <div className="flex items-start gap-2 p-3 bg-[#fff8e5] border border-[#ffeebf] rounded-lg">
              <AlertTriangle className="w-4 h-4 text-[#7a4200] shrink-0 mt-0.5" />
              <p className="text-[13px] text-[#7a4200]">
                {conflictingFields.length} field{conflictingFields.length > 1 ? "s differ" : " differs"} between the two records.
                Choose which value to keep for each.
              </p>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[160px_1fr_1fr] gap-4 px-4 py-2 bg-[#fafafa] rounded-lg">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Field</span>
              <div className="flex items-center gap-2">
                <div className="mt-0.5 w-3 h-3 rounded-full border-2 border-interactive-primary" />
                <span className="text-[12px] font-semibold text-text-primary truncate">{effectivePrimary.name}</span>
                <span className="text-[10px] bg-tag-teal-bg text-tag-teal-fg px-1 py-0.5 rounded">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-text-primary truncate">{effectiveSecondary.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              {conflictingFields.map((key) => {
                const pVal = getContactFields(primaryContact)[key] ?? "";
                const sVal = secondary ? getContactFields(secondary)[key] ?? "" : "";
                const pIsChosen = fieldChoices[key] === "primary";

                return (
                  <div key={key} className="grid grid-cols-[160px_1fr_1fr] gap-4 items-start px-4 py-3 bg-white border border-border-secondary rounded-lg">
                    <span className="text-[12px] font-semibold text-text-secondary pt-0.5">{FIELD_LABELS[key]}</span>

                    {/* Primary value */}
                    <button
                      onClick={() => setFieldChoices((prev) => ({ ...prev, [key]: "primary" }))}
                      className={cn(
                        "flex items-start gap-2 px-3 py-2 rounded-lg border text-left transition-colors",
                        pIsChosen
                          ? "border-interactive-primary bg-[#fff5f5]"
                          : "border-border-secondary hover:bg-[#fafafa]"
                      )}
                    >
                      <div className="mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center"
                        style={{ borderColor: pIsChosen ? "var(--interactive-primary)" : "var(--border-secondary)" }}>
                        {pIsChosen && <span className="w-1.5 h-1.5 rounded-full bg-interactive-primary" />}
                      </div>
                      <span className="text-[13px] text-text-primary">{pVal}</span>
                    </button>

                    {/* Secondary value */}
                    <button
                      onClick={() => setFieldChoices((prev) => ({ ...prev, [key]: "secondary" }))}
                      className={cn(
                        "flex items-start gap-2 px-3 py-2 rounded-lg border text-left transition-colors",
                        !pIsChosen
                          ? "border-interactive-primary bg-[#fff5f5]"
                          : "border-border-secondary hover:bg-[#fafafa]"
                      )}
                    >
                      <div className="mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center"
                        style={{ borderColor: !pIsChosen ? "var(--interactive-primary)" : "var(--border-secondary)" }}>
                        {!pIsChosen && <span className="w-1.5 h-1.5 rounded-full bg-interactive-primary" />}
                      </div>
                      <span className="text-[13px] text-text-primary">{sVal}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="md" onClick={() => setStep("select")}>Back</Button>
              <Button size="md" onClick={() => setStep("confirm")}>Review merge</Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && secondary && effectivePrimary && effectiveSecondary && (
          <div className="space-y-5">
            <div className="bg-white border border-border-secondary rounded-xl p-5">
              <p className="text-[13px] font-semibold text-text-primary mb-4">Merge summary</p>

              <div className="grid grid-cols-2 gap-4 mb-5">
                {[
                  { label: "Surviving record", c: effectivePrimary },
                  { label: "Will be archived", c: effectiveSecondary },
                ].map(({ label, c }) => (
                  <div key={c.id} className="p-3 bg-[#fafafa] rounded-lg">
                    <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">{label}</p>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-[5px] flex items-center justify-center text-[12px] font-semibold shrink-0",
                        AVATAR_BG[c.avatarColor ?? "blue"]
                      )}>
                        {c.nameInitial}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-text-primary">{c.name}</p>
                        <p className="text-[11px] text-text-secondary">{c.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[13px]">
                {[
                  { label: "Activity events", value: `${primaryContact.timeline.length + secondary.timeline.length} events consolidated` },
                  { label: "Notes", value: `${primaryContact.notes.length + secondary.notes.length} notes` },
                  { label: "Tasks", value: `${primaryContact.tasks.length + secondary.tasks.length} tasks` },
                  { label: "Tags", value: `${new Set([...primaryContact.tags.map(t => t.label), ...secondary.tags.map(t => t.label)]).size} unique tags` },
                  { label: "Source attributions", value: `${primaryContact.attributions.length + secondary.attributions.length} records preserved` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-[#f5f5f5] last:border-0">
                    <span className="text-text-secondary">{label}</span>
                    <span className="text-text-primary font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-[#fde8e9] border border-[#fde8e9] rounded-lg">
              <AlertTriangle className="w-4 h-4 text-[#b0000a] shrink-0 mt-0.5" />
              <p className="text-[13px] text-[#b0000a]">
                <strong>This action is irreversible.</strong> The archived record will no longer appear in the directory. All existing links to it will redirect to the surviving record.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="md" onClick={() => setStep(conflictingFields.length > 0 ? "resolve" : "select")}>
                Back
              </Button>
              <Button
                size="md"
                className="bg-[#b0000a] hover:bg-[#8a0007] text-white border-0"
                onClick={handleConfirmMerge}
              >
                Confirm merge
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
