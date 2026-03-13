"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, ChevronRight, CheckCircle2, AlertTriangle, FileText, X } from "lucide-react";
import { useContacts, contactStore, type ContactType, type EngagementScore, type FullContact } from "@/lib/contact-store";
import { cn } from "@/lib/utils";

type ImportStep = "upload" | "map" | "review" | "done";

const ALL_TYPES: ContactType[] = [
  "Parent/Guardian", "Student", "Agent", "Recommender", "Feeder School Contact", "General",
];

const SYSTEM_FIELDS = [
  { key: "name", label: "Full name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "type", label: "Contact type", required: false },
  { key: "source", label: "Source", required: false },
  { key: "tags", label: "Tags (comma-separated)", required: false },
];

type ParsedRow = Record<string, string>;

interface MappedContact {
  name: string;
  email: string;
  phone?: string;
  type: ContactType;
  source: string;
  tags: string[];
  status: "new" | "duplicate" | "invalid";
  reason?: string;
}

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row: ParsedRow = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ""; });
    return row;
  });
  return { headers, rows };
}

function autoMapColumns(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

  const aliases: Record<string, string[]> = {
    name: ["name", "fullname", "contactname", "firstname"],
    email: ["email", "emailaddress", "mail"],
    phone: ["phone", "phonenumber", "mobile", "tel"],
    type: ["type", "contacttype", "category"],
    source: ["source", "leadsource", "origin"],
    tags: ["tags", "labels", "groups"],
  };

  headers.forEach((header) => {
    const norm = normalize(header);
    Object.entries(aliases).forEach(([field, aliasList]) => {
      if (aliasList.some((a) => norm.includes(a))) {
        if (!map[field]) map[field] = header;
      }
    });
  });

  return map;
}

const SAMPLE_CSV = `Name,Email,Phone,Type,Source
Sarah Johnson,sarah.j@example.com,+1 555 0101,Parent/Guardian,Event registration
Tom Chen,t.chen@acme.com,+1 555 0102,Agent,Manual entry
Emma Williams,emma.w@email.com,,Student,Application
`;

export default function ImportContactsPage() {
  const router = useRouter();
  const store = useContacts();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<ParsedRow[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [defaultType, setDefaultType] = useState<ContactType>("Parent/Guardian");
  const [mappedContacts, setMappedContacts] = useState<MappedContact[]>([]);
  const [importResult, setImportResult] = useState<{ created: number; flagged: number } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows } = parseCSV(text);
      setHeaders(h);
      setRawRows(rows);
      setColumnMap(autoMapColumns(h));
      setStep("map");
    };
    reader.readAsText(file);
  }

  function handleLoadSample() {
    const { headers: h, rows } = parseCSV(SAMPLE_CSV);
    setFileName("sample-contacts.csv");
    setHeaders(h);
    setRawRows(rows);
    setColumnMap(autoMapColumns(h));
    setStep("map");
  }

  function buildMappedContacts(): MappedContact[] {
    const existing = store.getAll();
    return rawRows.map((row) => {
      const name = (columnMap.name ? row[columnMap.name] : "") ?? "";
      const email = (columnMap.email ? row[columnMap.email] : "") ?? "";
      const phone = columnMap.phone ? row[columnMap.phone] : undefined;
      const typeRaw = columnMap.type ? row[columnMap.type] : "";
      const type: ContactType = ALL_TYPES.includes(typeRaw as ContactType)
        ? (typeRaw as ContactType)
        : defaultType;
      const source = (columnMap.source ? row[columnMap.source] : "Import") ?? "Import";
      const tagsRaw = (columnMap.tags ? row[columnMap.tags] : "") ?? "";
      const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

      if (!name.trim()) return { name, email, type, source, tags, status: "invalid" as const, reason: "Missing name" };
      if (!email.trim()) return { name, email, type, source, tags, status: "invalid" as const, reason: "Missing email" };

      const isDuplicate = existing.some((c) => c.email.toLowerCase() === email.toLowerCase().trim());
      return {
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || undefined,
        type, source, tags,
        status: isDuplicate ? "duplicate" as const : "new" as const,
        reason: isDuplicate ? "Email matches existing contact" : undefined,
      };
    });
  }

  function handleMappingConfirm() {
    const contacts = buildMappedContacts();
    setMappedContacts(contacts);
    setStep("review");
  }

  function handleImport() {
    const toImport = mappedContacts
      .filter((c) => c.status === "new")
      .map((c) => ({
        name: c.name,
        nameInitial: c.name[0]?.toUpperCase() ?? "?",
        avatarColor: (["blue", "yellow", "green", "red"] as const)[Math.floor(Math.random() * 4)],
        type: c.type,
        email: c.email,
        phone: c.phone,
        source: c.source,
        engagementScore: "Unknown" as EngagementScore,
        tags: c.tags.map((label) => ({ label, variant: "gray" as const })),
        addedAt: new Date().toISOString().slice(0, 10),
        status: "Active" as const,
      }));

    const result = contactStore.bulkCreate(toImport);
    setImportResult(result);
    setStep("done");
  }

  const newCount = mappedContacts.filter((c) => c.status === "new").length;
  const dupeCount = mappedContacts.filter((c) => c.status === "duplicate").length;
  const invalidCount = mappedContacts.filter((c) => c.status === "invalid").length;

  const pageHeader = (
    <PageHeader
      title="Import contacts"
      actions={
        <Button variant="outline" size="md" onClick={() => router.push("/crm/contacts")}>
          <ArrowLeft className="w-4 h-4" /> Back to contacts
        </Button>
      }
    />
  );

  return (
    <DashboardLayout pageHeader={pageHeader}>
      <div className="p-6 max-w-3xl mx-auto">

        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {([
            { key: "upload", label: "Upload file" },
            { key: "map", label: "Map columns" },
            { key: "review", label: "Review" },
            { key: "done", label: "Done" },
          ] as { key: ImportStep; label: string }[]).map((s, i, arr) => {
            const steps: ImportStep[] = ["upload", "map", "review", "done"];
            const currentIdx = steps.indexOf(step);
            const thisIdx = steps.indexOf(s.key);
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium",
                  step === s.key
                    ? "bg-interactive-primary text-white"
                    : thisIdx < currentIdx
                      ? "bg-[#e5f9f0] text-[#006b44]"
                      : "bg-[#f0f0f0] text-text-secondary"
                )}>
                  {i + 1}. {s.label}
                </div>
                {i < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-5">
            <div
              className="border-2 border-dashed border-border-secondary rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-interactive-primary hover:bg-[#fff5f5] transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-text-secondary" />
              <div className="text-center">
                <p className="text-[14px] font-medium text-text-primary">Click to upload a CSV file</p>
                <p className="text-[12px] text-text-secondary mt-0.5">or drag and drop</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border-secondary" />
              <span className="text-[12px] text-text-secondary">or</span>
              <div className="flex-1 h-px bg-border-secondary" />
            </div>

            <Button variant="outline" size="md" className="w-full" onClick={handleLoadSample}>
              <FileText className="w-4 h-4" />
              Load sample CSV to try it out
            </Button>

            <div className="bg-[#fafafa] rounded-lg p-4">
              <p className="text-[12px] font-semibold text-text-primary mb-2">Expected columns</p>
              <div className="flex flex-wrap gap-2">
                {SYSTEM_FIELDS.map((f) => (
                  <span key={f.key} className={cn(
                    "text-[11px] px-2 py-1 rounded border",
                    f.required
                      ? "border-interactive-primary text-interactive-primary bg-[#fff5f5]"
                      : "border-border-secondary text-text-secondary"
                  )}>
                    {f.label} {f.required ? "*" : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Map columns */}
        {step === "map" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 p-3 bg-[#fafafa] border border-border-secondary rounded-lg">
              <FileText className="w-4 h-4 text-text-secondary shrink-0" />
              <span className="text-[13px] text-text-primary font-medium">{fileName}</span>
              <span className="text-[12px] text-text-secondary ml-auto">{rawRows.length} rows detected</span>
            </div>

            <div>
              <p className="text-[12px] font-semibold text-text-primary mb-3">Column mappings</p>
              <div className="space-y-2">
                {SYSTEM_FIELDS.map((f) => (
                  <div key={f.key} className="grid grid-cols-2 gap-3 items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] text-text-primary">{f.label}</span>
                      {f.required && <span className="text-interactive-primary text-[12px]">*</span>}
                    </div>
                    <select
                      value={columnMap[f.key] ?? ""}
                      onChange={(e) => setColumnMap((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      className="border border-border-secondary rounded-lg px-3 py-1.5 text-[13px] text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-interactive-primary/30 focus:border-interactive-primary"
                    >
                      <option value="">— Not mapped —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[12px] font-semibold text-text-primary mb-1.5">
                Default contact type <span className="font-normal text-text-secondary">(used when type column is missing or unrecognised)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setDefaultType(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[12px] border transition-colors",
                      defaultType === t
                        ? "border-interactive-primary bg-[#fff5f5] text-interactive-primary font-medium"
                        : "border-border-secondary hover:bg-[#fafafa] text-text-primary"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview first 3 rows */}
            {rawRows.slice(0, 3).length > 0 && (
              <div>
                <p className="text-[12px] font-semibold text-text-primary mb-2">Preview (first 3 rows)</p>
                <div className="border border-border-secondary rounded-lg overflow-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-[#fafafa] border-b border-border-secondary">
                        {SYSTEM_FIELDS.filter((f) => columnMap[f.key]).map((f) => (
                          <th key={f.key} className="px-3 py-2 text-left font-semibold text-text-secondary whitespace-nowrap">
                            {f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawRows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b border-border-secondary last:border-0">
                          {SYSTEM_FIELDS.filter((f) => columnMap[f.key]).map((f) => (
                            <td key={f.key} className="px-3 py-2 text-text-primary">
                              {columnMap[f.key] ? row[columnMap[f.key]] : ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="md" onClick={() => setStep("upload")}>Back</Button>
              <Button
                size="md"
                disabled={!columnMap.name || !columnMap.email}
                onClick={handleMappingConfirm}
              >
                Check for duplicates
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === "review" && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "New contacts", value: newCount, color: "text-[#008768]", bg: "bg-[#e5f9f0]" },
                { label: "Potential duplicates", value: dupeCount, color: "text-[#7a4200]", bg: "bg-[#fff8e5]" },
                { label: "Invalid rows", value: invalidCount, color: "text-[#b0000a]", bg: "bg-[#fde8e9]" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={cn("rounded-lg p-3 text-center", bg)}>
                  <p className={cn("text-[24px] font-bold", color)}>{value}</p>
                  <p className={cn("text-[12px] font-medium", color)}>{label}</p>
                </div>
              ))}
            </div>

            {/* Rows list */}
            <div className="border border-border-secondary rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              {mappedContacts.map((c, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 border-b border-border-secondary last:border-0",
                    c.status === "duplicate" && "bg-[#fff8e5]",
                    c.status === "invalid" && "bg-[#fde8e9]",
                  )}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    {c.status === "new" && <CheckCircle2 className="w-4 h-4 text-[#008768]" />}
                    {c.status === "duplicate" && <AlertTriangle className="w-4 h-4 text-[#7a4200]" />}
                    {c.status === "invalid" && <X className="w-4 h-4 text-[#b0000a]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-text-primary font-medium truncate">{c.name || "(no name)"}</p>
                    <p className="text-[11px] text-text-secondary truncate">{c.email || "(no email)"}</p>
                  </div>
                  <span className="text-[11px] text-text-secondary shrink-0">{c.type}</span>
                  {c.reason && (
                    <span className="text-[11px] text-[#7a4200] shrink-0">{c.reason}</span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[12px] text-text-secondary">
              Duplicate rows will be skipped. Invalid rows will be skipped. {newCount} new contact{newCount !== 1 ? "s" : ""} will be created.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="md" onClick={() => setStep("map")}>Back</Button>
              <Button size="md" onClick={handleImport} disabled={newCount === 0}>
                Import {newCount} contact{newCount !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === "done" && importResult && (
          <div className="flex flex-col items-center gap-5 py-8">
            <CheckCircle2 className="w-14 h-14 text-[#008768]" />
            <div className="text-center">
              <p className="text-[18px] font-bold text-text-primary">Import complete</p>
              <p className="text-[14px] text-text-secondary mt-1">
                {importResult.created} contact{importResult.created !== 1 ? "s" : ""} created
                {importResult.flagged > 0 ? `, ${importResult.flagged} skipped as duplicates` : ""}.
              </p>
            </div>
            <Button size="md" onClick={() => router.push("/crm/contacts")}>
              Go to contact directory
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
