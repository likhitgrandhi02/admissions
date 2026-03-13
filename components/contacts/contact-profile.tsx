"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Plus, CheckCircle2, Circle, ChevronDown, ChevronUp,
  Link2, Unlink, ExternalLink, Calendar, Mail,
  Phone, MapPin, Globe, Tag, Edit3, Info,
  FileText, CheckSquare, Clock, Activity, User,
} from "lucide-react";
import {
  contactStore,
  useContacts,
  type FullContact,
  type ActivityEvent,
  type ContactNote,
  type ContactTask,
  type ActivityEventType,
  VALID_RELATIONSHIP_TYPES,
} from "@/lib/contact-store";
import { LinkContactModal } from "@/components/contacts/modals/link-contact-modal";
import { AddNoteModal } from "@/components/contacts/modals/add-note-modal";
import { AddTaskModal } from "@/components/contacts/modals/add-task-modal";
import { EditContactModal } from "@/components/contacts/modals/edit-contact-modal";

// ─── Design constants ─────────────────────────────────────────────────────────

const SCORE_CONFIG = {
  Hot: { dot: "bg-[#f04c54]", text: "text-[#b0000a]", bg: "bg-[#fde8e9]" },
  Warm: { dot: "bg-[#ff9e2c]", text: "text-[#7a4200]", bg: "bg-[#fff3e5]" },
  Cold: { dot: "bg-[#009cad]", text: "text-[#00616e]", bg: "bg-[#e5fbfd]" },
  Unknown: { dot: "bg-border-secondary", text: "text-text-secondary", bg: "bg-[#f0f0f0]" },
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

const EVENT_ICON: Partial<Record<ActivityEventType, React.ReactNode>> = {
  "Contact Created": <User className="w-3.5 h-3.5" />,
  "Note Added": <FileText className="w-3.5 h-3.5" />,
  "Task Created": <CheckSquare className="w-3.5 h-3.5" />,
  "Task Completed": <CheckCircle2 className="w-3.5 h-3.5 text-[#008768]" />,
  "Email Sent": <Mail className="w-3.5 h-3.5" />,
  "Email Opened": <Mail className="w-3.5 h-3.5 text-[#008768]" />,
  "Form Submitted": <FileText className="w-3.5 h-3.5 text-interactive-primary" />,
  "Event Attended": <Calendar className="w-3.5 h-3.5 text-[#5000b8]" />,
  "Pipeline Stage Changed": <Activity className="w-3.5 h-3.5 text-[#ff9e2c]" />,
  "Relationship Added": <Link2 className="w-3.5 h-3.5 text-tag-blue-fg" />,
  "Relationship Removed": <Unlink className="w-3.5 h-3.5 text-text-secondary" />,
  "Contact Merged": <Info className="w-3.5 h-3.5 text-[#5000b8]" />,
};

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, action, children, className }: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-white border border-border-secondary rounded-lg overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-secondary">
        <span className="text-[13px] font-semibold text-text-primary">{title}</span>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-1.5 border-b border-[#f5f5f5] last:border-0">
      <span className="text-[12px] text-text-secondary w-32 shrink-0">{label}</span>
      <span className="text-[13px] text-text-primary">{value}</span>
    </div>
  );
}

// ─── Timeline entry ─────────────────────────────────────────────────────────

function TimelineEntry({ event }: { event: ActivityEvent }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-[#f5f5f5] last:border-0">
      <div className="w-7 h-7 rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0 text-text-secondary">
        {EVENT_ICON[event.type] ?? <Activity className="w-3.5 h-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-text-primary leading-5">{event.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-text-secondary">
            {new Date(event.timestamp).toLocaleDateString("en-GB", {
              day: "2-digit", month: "short", year: "numeric",
            })}{" "}
            {new Date(event.timestamp).toLocaleTimeString("en-GB", {
              hour: "2-digit", minute: "2-digit",
            })}
          </span>
          {event.staffMember && (
            <>
              <span className="text-[11px] text-text-secondary">·</span>
              <span className="text-[11px] text-text-secondary">{event.staffMember}</span>
            </>
          )}
          <span className="text-[10px] text-text-secondary bg-[#f5f5f5] px-1.5 py-0.5 rounded">
            {event.sourceModule}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Note card ──────────────────────────────────────────────────────────────

function NoteCard({ note }: { note: ContactNote }) {
  return (
    <div className="py-3 border-b border-[#f5f5f5] last:border-0">
      <p className="text-[13px] text-text-primary leading-5 whitespace-pre-wrap">{note.content}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[11px] text-text-secondary font-medium">{note.author}</span>
        <span className="text-[11px] text-text-secondary">·</span>
        <span className="text-[11px] text-text-secondary">
          {new Date(note.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}

// ─── Task card ──────────────────────────────────────────────────────────────

function TaskCard({ task, onComplete }: { task: ContactTask; onComplete: () => void }) {
  const overdue = task.status === "Open" && task.dueDate && new Date(task.dueDate) < new Date();
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#f5f5f5] last:border-0">
      <button onClick={onComplete} disabled={task.status === "Completed"} className="mt-0.5 shrink-0">
        {task.status === "Completed"
          ? <CheckCircle2 className="w-4 h-4 text-[#008768]" />
          : <Circle className="w-4 h-4 text-border-bold-secondary hover:text-text-primary transition-colors" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[13px] text-text-primary leading-5", task.status === "Completed" && "line-through text-text-secondary")}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-[12px] text-text-secondary mt-0.5">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className={cn("text-[11px]", overdue ? "text-[#b0000a] font-medium" : "text-text-secondary")}>
            {task.dueDate
              ? `Due ${new Date(task.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
              : "No due date"}
            {overdue && " · Overdue"}
          </span>
          <span className="text-[11px] text-text-secondary">· {task.assignedTo}</span>
          {task.priority !== "Normal" && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-medium",
              task.priority === "High" ? "bg-[#fde8e9] text-[#b0000a]" : "bg-[#f0f0f0] text-text-secondary"
            )}>
              {task.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Profile View ───────────────────────────────────────────────────────

export function ContactProfileView({ contact }: { contact: FullContact }) {
  const store = useContacts();
  const relationships = store.getRelationships(contact.id);
  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const scoreConfig = SCORE_CONFIG[contact.engagementScore];
  const sortedTimeline = [...contact.timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const visibleTimeline = showAllTimeline ? sortedTimeline : sortedTimeline.slice(0, 5);
  const openTasks = contact.tasks.filter((t) => t.status === "Open");
  const completedTasks = contact.tasks.filter((t) => t.status === "Completed");

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Left column: sidebar */}
      <div className="w-72 shrink-0 border-r border-border-secondary overflow-y-auto flex flex-col gap-4 p-4 bg-[#fafafa]">

        {/* Identity card */}
        <div className="bg-white border border-border-secondary rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center text-[20px] font-bold",
                AVATAR_BG[contact.avatarColor ?? "blue"]
              )}
            >
              {contact.nameInitial}
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1.5 rounded hover:bg-[#f5f5f5] text-text-secondary transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
          <h2 className="text-[15px] font-semibold text-text-primary leading-5 mb-1">{contact.name}</h2>
          <span className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded-[3px] text-[11px] font-medium",
            TYPE_COLORS[contact.type] ?? "bg-[#f0f0f0] text-text-secondary"
          )}>
            {contact.type}
          </span>

          {/* Engagement score */}
          {contact.type !== "Student" && (
            <div className={cn("flex items-center gap-2 mt-3 px-2.5 py-1.5 rounded-lg", scoreConfig.bg)}>
              <span className={cn("w-2 h-2 rounded-full shrink-0", scoreConfig.dot)} />
              <span className={cn("text-[13px] font-semibold", scoreConfig.text)}>
                {contact.engagementScore}
              </span>
              <span className={cn("text-[11px] ml-auto", scoreConfig.text)}>
                {contact.engagementScoreValue}/100
              </span>
            </div>
          )}
        </div>

        {/* Contact details */}
        <Section title="Contact details" action={
          <button onClick={() => setShowEditModal(true)} className="text-[12px] text-interactive-primary hover:underline">
            Edit
          </button>
        }>
          <div className="space-y-0">
            {contact.email && (
              <div className="flex items-center gap-2 py-1.5">
                <Mail className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                <span className="text-[13px] text-text-primary truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 py-1.5">
                <Phone className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                <span className="text-[13px] text-text-primary">{contact.phone}</span>
              </div>
            )}
            {contact.address && (
              <div className="flex items-center gap-2 py-1.5">
                <MapPin className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                <span className="text-[13px] text-text-primary">{contact.address}</span>
              </div>
            )}
            {contact.languagePreference && (
              <div className="flex items-center gap-2 py-1.5">
                <Globe className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                <span className="text-[13px] text-text-primary">{contact.languagePreference}</span>
              </div>
            )}
            {(!contact.email && !contact.phone && !contact.address && !contact.languagePreference) && (
              <p className="text-[12px] text-text-secondary">No contact details.</p>
            )}
          </div>
        </Section>

        {/* Tags */}
        {contact.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.map((tag, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded-[3px] text-[11px] font-medium",
                    tag.variant === "teal" ? "bg-tag-teal-bg text-tag-teal-fg" :
                    tag.variant === "violet" ? "bg-tag-violet-bg text-tag-violet-fg" :
                    tag.variant === "blue" ? "bg-tag-blue-bg text-tag-blue-fg" :
                    tag.variant === "yellow" ? "bg-tag-yellow-bg text-tag-yellow-fg" :
                    "bg-[#f0f0f0] text-text-secondary"
                  )}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Source attribution */}
        {contact.attributions.length > 0 && (
          <Section title="Source">
            {contact.attributions.slice(-1).map((attr) => (
              <div key={attr.id} className="space-y-1">
                <p className="text-[13px] font-medium text-text-primary">{attr.sourceCategory}</p>
                {attr.utmCampaign && (
                  <p className="text-[11px] text-text-secondary">Campaign: {attr.utmCampaign}</p>
                )}
                {attr.utmSource && (
                  <p className="text-[11px] text-text-secondary">Source: {attr.utmSource} / {attr.utmMedium}</p>
                )}
                {attr.formType && (
                  <p className="text-[11px] text-text-secondary">Form: {attr.formType}</p>
                )}
                <p className="text-[11px] text-text-secondary">
                  {attr.isFirstTouch ? "First touch" : "Last touch"} ·{" "}
                  {new Date(attr.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </Section>
        )}

        {/* Extra fields for Students */}
        {contact.type === "Student" && (contact.dateOfBirth || contact.yearGroup || contact.programme) && (
          <Section title="Student details">
            <FieldRow label="Date of birth" value={contact.dateOfBirth} />
            <FieldRow label="Year group" value={contact.yearGroup} />
            <FieldRow label="Programme" value={contact.programme} />
          </Section>
        )}

        {/* Pipeline */}
        {contact.pipelineStage && (
          <Section title="Pipeline">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff9e2c] shrink-0" />
              <span className="text-[13px] text-text-primary">{contact.pipelineStage}</span>
            </div>
          </Section>
        )}

        {/* Staff owner */}
        {contact.staffRep && (
          <Section title="Owner">
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-6 h-6 rounded-[4px] flex items-center justify-center text-[11px] font-semibold",
                AVATAR_BG.blue
              )}>
                {contact.staffRepInitial}
              </span>
              <span className="text-[13px] text-text-primary">{contact.staffRep}</span>
            </div>
          </Section>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

        {/* Relationships */}
        <Section
          title={`Relationships (${relationships.length})`}
          action={
            <Button size="xs" variant="outline" onClick={() => setShowLinkModal(true)}>
              <Plus className="w-3 h-3" />
              Link contact
            </Button>
          }
        >
          {relationships.length === 0 ? (
            <p className="text-[13px] text-text-secondary">No relationships linked.</p>
          ) : (
            <div className="divide-y divide-[#f5f5f5]">
              {relationships.map((rel) => (
                <div key={rel.id} className="flex items-center gap-3 py-2.5">
                  <div className={cn(
                    "w-8 h-8 rounded-[5px] flex items-center justify-center text-[12px] font-semibold shrink-0",
                    AVATAR_BG[rel.contact.avatarColor ?? "blue"]
                  )}>
                    {rel.contact.nameInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/crm/contacts/${rel.contact.id}`}
                      className="text-[13px] font-medium text-text-primary hover:text-interactive-primary transition-colors"
                    >
                      {rel.contact.name}
                    </a>
                    <p className="text-[11px] text-text-secondary">{rel.type}</p>
                  </div>
                  <span className={cn(
                    "text-[11px] px-1.5 py-0.5 rounded-[3px] font-medium",
                    TYPE_COLORS[rel.contact.type] ?? "bg-[#f0f0f0] text-text-secondary"
                  )}>
                    {rel.contact.type}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Remove relationship with ${rel.contact.name}?`)) {
                        contactStore.removeRelationship(rel.id);
                      }
                    }}
                    className="p-1 rounded hover:bg-[#f5f5f5] text-text-secondary transition-colors"
                    title="Unlink"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Tasks */}
        <Section
          title={`Tasks (${openTasks.length} open)`}
          action={
            <Button size="xs" variant="outline" onClick={() => setShowTaskModal(true)}>
              <Plus className="w-3 h-3" />
              Add task
            </Button>
          }
        >
          {contact.tasks.length === 0 ? (
            <p className="text-[13px] text-text-secondary">No tasks yet.</p>
          ) : (
            <div>
              {openTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => contactStore.completeTask(contact.id, task.id)}
                />
              ))}
              {completedTasks.length > 0 && (
                <>
                  <p className="text-[11px] text-text-secondary font-semibold mt-3 mb-1 uppercase tracking-wide">
                    Completed ({completedTasks.length})
                  </p>
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={() => {}}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </Section>

        {/* Notes */}
        <Section
          title={`Notes (${contact.notes.length})`}
          action={
            <Button size="xs" variant="outline" onClick={() => setShowNoteModal(true)}>
              <Plus className="w-3 h-3" />
              Add note
            </Button>
          }
        >
          {contact.notes.length === 0 ? (
            <p className="text-[13px] text-text-secondary">No notes yet.</p>
          ) : (
            <div>
              {[...contact.notes]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
            </div>
          )}
        </Section>

        {/* Activity timeline */}
        <Section title={`Activity timeline (${contact.timeline.length})`}>
          <div>
            {visibleTimeline.map((event) => (
              <TimelineEntry key={event.id} event={event} />
            ))}
            {sortedTimeline.length > 5 && (
              <button
                onClick={() => setShowAllTimeline(!showAllTimeline)}
                className="flex items-center gap-1 mt-2 text-[12px] text-interactive-primary hover:underline"
              >
                {showAllTimeline ? (
                  <><ChevronUp className="w-3 h-3" /> Show less</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Show all {sortedTimeline.length} events</>
                )}
              </button>
            )}
          </div>
        </Section>
      </div>

      {/* Modals */}
      {showLinkModal && (
        <LinkContactModal
          contact={contact}
          onClose={() => setShowLinkModal(false)}
        />
      )}
      {showNoteModal && (
        <AddNoteModal
          contact={contact}
          onClose={() => setShowNoteModal(false)}
        />
      )}
      {showTaskModal && (
        <AddTaskModal
          contact={contact}
          onClose={() => setShowTaskModal(false)}
        />
      )}
      {showEditModal && (
        <EditContactModal
          contact={contact}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
