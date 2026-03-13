"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Merge, X, ChevronRight, CheckCircle2, Eye } from "lucide-react";
import { useContacts, contactStore } from "@/lib/contact-store";
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

const CONFIDENCE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: "High confidence", color: "text-[#b0000a]", bg: "bg-[#fde8e9]" },
  medium: { label: "Medium confidence", color: "text-[#7a4200]", bg: "bg-[#fff8e5]" },
  low: { label: "Low confidence", color: "text-[#00616e]", bg: "bg-[#e5fbfd]" },
};

function confidenceTier(confidence: number) {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.65) return "medium";
  return "low";
}

function ContactCard({ contact }: { contact: ReturnType<typeof contactStore.getById> }) {
  if (!contact) return null;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0",
        AVATAR_BG[contact.avatarColor ?? "blue"]
      )}>
        {contact.nameInitial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-text-primary truncate">{contact.name}</p>
        <p className="text-[12px] text-text-secondary truncate">{contact.email}</p>
        {contact.phone && <p className="text-[12px] text-text-secondary">{contact.phone}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={cn(
          "text-[11px] px-1.5 py-0.5 rounded-[3px] font-medium",
          TYPE_COLORS[contact.type] ?? "bg-[#f0f0f0] text-text-secondary"
        )}>
          {contact.type}
        </span>
        <span className="text-[11px] text-text-secondary">
          Added {new Date(contact.addedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}

export default function DeduplicationPage() {
  const router = useRouter();
  const store = useContacts();
  const [tab, setTab] = useState<"pending" | "resolved">("pending");

  const pendingDupes = store.getDuplicates(["Pending"]);
  const resolvedDupes = store.getDuplicates(["Merged", "Dismissed"]);
  const displayDupes = tab === "pending" ? pendingDupes : resolvedDupes;

  const pageHeader = (
    <PageHeader
      title="Deduplication"
      actions={
        <span className="text-[13px] text-text-secondary">
          {pendingDupes.length} pair{pendingDupes.length !== 1 ? "s" : ""} pending review
        </span>
      }
    />
  );

  return (
    <DashboardLayout pageHeader={pageHeader}>
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex border-b border-border-secondary px-6 bg-white shrink-0">
          {([
            { key: "pending", label: "Pending review", count: pendingDupes.length },
            { key: "resolved", label: "Resolved", count: resolvedDupes.length },
          ] as { key: typeof tab; label: string; count: number }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors",
                tab === t.key
                  ? "border-interactive-primary text-text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              )}
            >
              {t.label}
              <span className={cn(
                "text-[11px] px-1.5 py-0.5 rounded-full font-medium",
                tab === t.key ? "bg-interactive-primary text-white" : "bg-[#f0f0f0] text-text-secondary"
              )}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {displayDupes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <CheckCircle2 className="w-10 h-10 text-[#008768]" />
              <p className="text-[15px] font-semibold text-text-primary">
                {tab === "pending" ? "No duplicates to review" : "No resolved pairs"}
              </p>
              <p className="text-[13px] text-text-secondary">
                {tab === "pending"
                  ? "The system will flag potential duplicates here when they are detected."
                  : "Resolved duplicates will appear here."}
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {displayDupes.map((pair) => {
                const tier = confidenceTier(pair.confidence);
                const cfg = CONFIDENCE_LABEL[tier];
                const isResolved = pair.status !== "Pending";

                return (
                  <div key={pair.id} className="bg-white border border-border-secondary rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border-secondary">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[11px] px-2 py-0.5 rounded font-medium", cfg.bg, cfg.color)}>
                          {cfg.label}
                        </span>
                        <span className="text-[12px] text-text-secondary">
                          {Math.round(pair.confidence * 100)}% match
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isResolved ? (
                          <span className={cn(
                            "text-[11px] px-2 py-0.5 rounded font-medium",
                            pair.status === "Merged" ? "bg-[#e5f9f0] text-[#006b44]" : "bg-[#f0f0f0] text-text-secondary"
                          )}>
                            {pair.status}
                          </span>
                        ) : (
                          <>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => router.push(`/crm/contacts/${pair.contactAId}/merge`)}
                              className="gap-1"
                            >
                              <Merge className="w-3 h-3" />
                              Merge
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => contactStore.dismissDuplicate(pair.id)}
                              className="gap-1 text-text-secondary"
                            >
                              <X className="w-3 h-3" />
                              Dismiss
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Side-by-side contacts */}
                    <div className="grid grid-cols-2 divide-x divide-border-secondary">
                      <div className="px-4">
                        <div className="flex items-center justify-between">
                          <ContactCard contact={pair.contactA} />
                          <a
                            href={`/crm/contacts/${pair.contactA.id}`}
                            className="p-1 rounded hover:bg-[#f5f5f5] text-text-secondary transition-colors ml-2"
                            title="View profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                      <div className="px-4">
                        <div className="flex items-center justify-between">
                          <ContactCard contact={pair.contactB} />
                          <a
                            href={`/crm/contacts/${pair.contactB.id}`}
                            className="p-1 rounded hover:bg-[#f5f5f5] text-text-secondary transition-colors ml-2"
                            title="View profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Conflict summary */}
                    <div className="px-4 py-2.5 border-t border-border-secondary bg-[#fafafa]">
                      {pair.contactA.email === pair.contactB.email && (
                        <p className="text-[12px] text-text-secondary">
                          <span className="font-medium text-text-primary">Same email:</span> {pair.contactA.email}
                        </p>
                      )}
                      {pair.contactA.phone && pair.contactB.phone && pair.contactA.phone === pair.contactB.phone && (
                        <p className="text-[12px] text-text-secondary">
                          <span className="font-medium text-text-primary">Same phone:</span> {pair.contactA.phone}
                        </p>
                      )}
                      <p className="text-[11px] text-text-secondary mt-1">
                        Flagged {new Date(pair.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
