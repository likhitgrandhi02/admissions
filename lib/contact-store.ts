"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

import type { ContactRow, ContactType, EngagementScore, ContactTag } from "@/components/contacts/contacts-table";

export type { ContactRow, ContactType, EngagementScore, ContactTag };

export type RelationshipType =
  | "Parent/Guardian of"
  | "Child of"
  | "Spouse/Co-guardian of"
  | "Agent for"
  | "Feeder school contact for"
  | "Sibling of";

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  status: "Active" | "Removed";
}

export type ActivityEventType =
  | "Contact Created"
  | "Contact Updated"
  | "Contact Merged"
  | "Note Added"
  | "Task Created"
  | "Task Completed"
  | "Email Sent"
  | "Email Opened"
  | "Form Submitted"
  | "Event Attended"
  | "Pipeline Stage Changed"
  | "Portal Login"
  | "Engagement Score Updated"
  | "Relationship Added"
  | "Relationship Removed"
  | "Duplicate Flagged";

export interface ActivityEvent {
  id: string;
  contactId: string;
  type: ActivityEventType;
  description: string;
  sourceModule: string;
  staffMember?: string;
  timestamp: string; // ISO
}

export interface ContactNote {
  id: string;
  contactId: string;
  content: string;
  author: string;
  createdAt: string;
  propagatedTo: string[]; // contact IDs
}

export interface ContactTask {
  id: string;
  contactId: string;
  title: string;
  description?: string;
  assignedTo: string;
  dueDate?: string;
  priority: "Low" | "Normal" | "High";
  status: "Open" | "Completed";
  createdAt: string;
}

export interface SourceAttribution {
  id: string;
  contactId: string;
  sourceCategory: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  formType?: string;
  referralSource?: string;
  isFirstTouch: boolean;
  createdAt: string;
}

export interface DuplicatePair {
  id: string;
  contactAId: string;
  contactBId: string;
  confidence: number; // 0–1
  status: "Pending" | "Merged" | "Dismissed";
  createdAt: string;
}

export interface FullContact extends ContactRow {
  status: "Active" | "Archived";
  dateOfBirth?: string;
  yearGroup?: string;
  programme?: string;
  languagePreference?: string;
  address?: string;
  notes: ContactNote[];
  tasks: ContactTask[];
  attributions: SourceAttribution[];
  timeline: ActivityEvent[];
  engagementScoreValue: number; // 0–100
  engagementScoreOverride?: EngagementScore;
}

// ─── Valid relationship types per contact type pair ───────────────────────────

export const VALID_RELATIONSHIP_TYPES: Record<ContactType, Record<ContactType, RelationshipType[]>> = {
  "Parent/Guardian": {
    Student: ["Parent/Guardian of"],
    "Parent/Guardian": ["Spouse/Co-guardian of"],
    Agent: [],
    Recommender: [],
    "Feeder School Contact": [],
    General: [],
  },
  Student: {
    "Parent/Guardian": ["Child of"],
    Student: ["Sibling of"],
    Agent: [],
    Recommender: [],
    "Feeder School Contact": [],
    General: [],
  },
  Agent: {
    Student: ["Agent for"],
    "Parent/Guardian": ["Agent for"],
    Agent: [],
    Recommender: [],
    "Feeder School Contact": [],
    General: [],
  },
  Recommender: {
    Student: [],
    "Parent/Guardian": [],
    Agent: [],
    Recommender: [],
    "Feeder School Contact": [],
    General: [],
  },
  "Feeder School Contact": {
    Student: ["Feeder school contact for"],
    "Parent/Guardian": [],
    Agent: [],
    Recommender: [],
    "Feeder School Contact": [],
    General: [],
  },
  General: {
    Student: [],
    "Parent/Guardian": [],
    Agent: [],
    Recommender: [],
    "Feeder School Contact": [],
    General: [],
  },
};

export function getInverseRelationshipType(type: RelationshipType): RelationshipType {
  const inverses: Record<RelationshipType, RelationshipType> = {
    "Parent/Guardian of": "Child of",
    "Child of": "Parent/Guardian of",
    "Spouse/Co-guardian of": "Spouse/Co-guardian of",
    "Agent for": "Agent for",
    "Feeder school contact for": "Feeder school contact for",
    "Sibling of": "Sibling of",
  };
  return inverses[type];
}

// ─── Engagement score computation ────────────────────────────────────────────

function bandFromScore(score: number): EngagementScore {
  if (score >= 70) return "Hot";
  if (score >= 30) return "Warm";
  if (score > 0) return "Cold";
  return "Cold";
}

// ─── Initial data ─────────────────────────────────────────────────────────────

import { SAMPLE_CONTACTS } from "@/components/contacts/contacts-data";

function makeTimeline(contactId: string, name: string, createdAt: string): ActivityEvent[] {
  return [
    {
      id: `${contactId}-ev1`,
      contactId,
      type: "Contact Created",
      description: `${name} was added to the contact directory.`,
      sourceModule: "CRM",
      timestamp: createdAt + "T09:00:00Z",
    },
  ];
}

function makeAttributions(contactId: string, source: string, createdAt: string): SourceAttribution[] {
  return [
    {
      id: `${contactId}-attr1`,
      contactId,
      sourceCategory: source,
      isFirstTouch: true,
      createdAt: createdAt + "T09:00:00Z",
    },
  ];
}

// Convert sample contacts to FullContacts
const FULL_CONTACTS: FullContact[] = SAMPLE_CONTACTS.map((c) => ({
  ...c,
  status: "Active" as const,
  notes: [],
  tasks: [],
  attributions: makeAttributions(c.id, c.source, c.addedAt),
  timeline: makeTimeline(c.id, c.name, c.addedAt),
  engagementScoreValue:
    c.engagementScore === "Hot" ? 80 :
    c.engagementScore === "Warm" ? 50 :
    c.engagementScore === "Cold" ? 15 : 0,
}));

// Add some richer data to make profiles interesting
const sarahTimeline: ActivityEvent[] = [
  {
    id: "1-ev1", contactId: "1", type: "Contact Created",
    description: "Sarah Parker was added via inquiry form.", sourceModule: "CRM",
    staffMember: "Oliver Stone", timestamp: "2025-11-12T09:00:00Z",
  },
  {
    id: "1-ev2", contactId: "1", type: "Form Submitted",
    description: "Submitted enquiry form: 'IB Programme Enquiry 2026'.",
    sourceModule: "Forms", timestamp: "2025-11-12T08:52:00Z",
  },
  {
    id: "1-ev3", contactId: "1", type: "Email Opened",
    description: "Opened email: 'Welcome to Toddle Academy'.", sourceModule: "Campaigns",
    timestamp: "2025-11-14T11:22:00Z",
  },
  {
    id: "1-ev4", contactId: "1", type: "Event Attended",
    description: "Attended Open Day — November 2025.", sourceModule: "Events",
    timestamp: "2025-11-18T14:00:00Z",
  },
  {
    id: "1-ev5", contactId: "1", type: "Pipeline Stage Changed",
    description: "Moved to Application stage.", sourceModule: "Pipeline",
    staffMember: "Oliver Stone", timestamp: "2025-12-01T10:30:00Z",
  },
];

FULL_CONTACTS[0] = {
  ...FULL_CONTACTS[0],
  timeline: sarahTimeline,
  attributions: [
    {
      id: "1-attr1", contactId: "1", sourceCategory: "Inquiry form",
      utmSource: "google", utmMedium: "cpc", utmCampaign: "ib-programme-2026",
      formType: "Enquiry", isFirstTouch: true, createdAt: "2025-11-12T08:52:00Z",
    },
  ],
  notes: [
    {
      id: "1-note1", contactId: "1",
      content: "Called on 18 Nov. Very interested in IB programme. Has two kids — Ethan (Grade 6) and a younger one starting in 2027. Follow up after open day.",
      author: "Oliver Stone", createdAt: "2025-11-18T15:00:00Z", propagatedTo: [],
    },
  ],
  tasks: [
    {
      id: "1-task1", contactId: "1", title: "Send application pack",
      description: "Email the 2026 application pack with fee schedule.",
      assignedTo: "Oliver Stone", dueDate: "2025-12-10", priority: "High",
      status: "Completed", createdAt: "2025-11-18T15:05:00Z",
    },
    {
      id: "1-task2", contactId: "1", title: "Follow up on submitted application",
      assignedTo: "Oliver Stone", dueDate: "2026-01-15", priority: "Normal",
      status: "Open", createdAt: "2025-12-01T10:35:00Z",
    },
  ],
};

// Initial relationships: Sarah (1) is parent of Ethan (3)
const INITIAL_RELATIONSHIPS: Relationship[] = [
  {
    id: "rel-1", sourceId: "1", targetId: "3",
    type: "Parent/Guardian of", status: "Active",
  },
  {
    id: "rel-2", sourceId: "3", targetId: "1",
    type: "Child of", status: "Active",
  },
];

// Initial duplicate pairs
const INITIAL_DUPLICATES: DuplicatePair[] = [
  {
    id: "dup-1", contactAId: "2", contactBId: "8",
    confidence: 0.72, status: "Pending", createdAt: "2025-12-03T08:00:00Z",
  },
];

// ─── Store ─────────────────────────────────────────────────────────────────────

let _contacts: FullContact[] = [...FULL_CONTACTS];
let _relationships: Relationship[] = [...INITIAL_RELATIONSHIPS];
let _duplicates: DuplicatePair[] = [...INITIAL_DUPLICATES];
let _nextId = 100;

let _listeners: Array<() => void> = [];

function notify() {
  _listeners.forEach((fn) => fn());
}

export const contactStore = {
  subscribe(fn: () => void) {
    _listeners.push(fn);
    return () => {
      _listeners = _listeners.filter((l) => l !== fn);
    };
  },

  // ── Contacts ──

  getAll(): FullContact[] {
    return _contacts.filter((c) => c.status !== "Archived");
  },

  getById(id: string): FullContact | undefined {
    return _contacts.find((c) => c.id === id);
  },

  create(data: Omit<FullContact, "id" | "timeline" | "notes" | "tasks" | "attributions" | "engagementScoreValue">): FullContact {
    const id = String(++_nextId);
    const now = new Date().toISOString();
    const contact: FullContact = {
      ...data,
      id,
      timeline: [
        {
          id: `${id}-ev1`, contactId: id, type: "Contact Created",
          description: `${data.name} was manually added to the contact directory.`,
          sourceModule: "CRM", timestamp: now,
        },
      ],
      notes: [],
      tasks: [],
      attributions: [
        {
          id: `${id}-attr1`, contactId: id,
          sourceCategory: "Manual entry", isFirstTouch: true, createdAt: now,
        },
      ],
      engagementScoreValue: 0,
    };
    _contacts = [..._contacts, contact];

    // Run basic duplicate check
    const dupes = contactStore.findPotentialDuplicates(contact);
    dupes.forEach((match) => {
      if (!_duplicates.find((d) => (d.contactAId === id && d.contactBId === match.id) || (d.contactAId === match.id && d.contactBId === id))) {
        _duplicates = [..._duplicates, {
          id: `dup-${Date.now()}`, contactAId: id, contactBId: match.id,
          confidence: 0.65, status: "Pending", createdAt: now,
        }];
      }
    });

    notify();
    return contact;
  },

  update(id: string, patch: Partial<FullContact>): void {
    _contacts = _contacts.map((c) => {
      if (c.id !== id) return c;
      const updated = { ...c, ...patch };
      updated.timeline = [
        ...c.timeline,
        {
          id: `${id}-ev${Date.now()}`, contactId: id, type: "Contact Updated" as ActivityEventType,
          description: "Contact details were updated.", sourceModule: "CRM",
          timestamp: new Date().toISOString(),
        },
      ];
      return updated;
    });
    notify();
  },

  archive(id: string): void {
    _contacts = _contacts.map((c) =>
      c.id === id ? { ...c, status: "Archived" as const } : c
    );
    notify();
  },

  findPotentialDuplicates(contact: FullContact): FullContact[] {
    return _contacts.filter((c) => {
      if (c.id === contact.id || c.status === "Archived") return false;
      if (c.email.toLowerCase() === contact.email.toLowerCase()) return true;
      if (c.phone && contact.phone && c.phone === contact.phone) return true;
      // Name similarity: same first+last
      const [aFirst = "", aLast = ""] = contact.name.split(" ");
      const [bFirst = "", bLast = ""] = c.name.split(" ");
      if (aFirst && aLast && bFirst && bLast &&
          aFirst.toLowerCase() === bFirst.toLowerCase() &&
          aLast.toLowerCase() === bLast.toLowerCase()) return true;
      return false;
    });
  },

  // ── Relationships ──

  getRelationships(contactId: string): Array<Relationship & { contact: FullContact }> {
    return _relationships
      .filter((r) => r.sourceId === contactId && r.status === "Active")
      .map((r) => {
        const contact = _contacts.find((c) => c.id === r.targetId)!;
        return { ...r, contact };
      })
      .filter((r) => r.contact);
  },

  addRelationship(sourceId: string, targetId: string, type: RelationshipType): void {
    const id = `rel-${Date.now()}`;
    const now = new Date().toISOString();
    _relationships = [
      ..._relationships,
      { id, sourceId, targetId, type, status: "Active" },
      { id: `${id}-inv`, sourceId: targetId, targetId: sourceId, type: getInverseRelationshipType(type), status: "Active" },
    ];

    // Log on both contacts
    const addEvent = (cid: string, desc: string) => {
      _contacts = _contacts.map((c) =>
        c.id === cid
          ? { ...c, timeline: [...c.timeline, { id: `${cid}-ev${Date.now()}`, contactId: cid, type: "Relationship Added" as ActivityEventType, description: desc, sourceModule: "CRM", timestamp: now }] }
          : c
      );
    };
    const src = _contacts.find((c) => c.id === sourceId);
    const tgt = _contacts.find((c) => c.id === targetId);
    if (src && tgt) {
      addEvent(sourceId, `Linked to ${tgt.name} as "${type}".`);
      addEvent(targetId, `Linked to ${src.name} as "${getInverseRelationshipType(type)}".`);
    }

    // Auto-detect siblings: if source and target are both students sharing a parent
    if (src?.type === "Student" && tgt?.type === "Student") {
      // already siblings if shared parent
    }
    if (type === "Parent/Guardian of") {
      // find other students of this parent → sibling links
      const siblings = _relationships
        .filter((r) => r.sourceId === sourceId && r.type === "Parent/Guardian of" && r.targetId !== targetId && r.status === "Active");
      siblings.forEach((sib) => {
        if (!_relationships.find((r) =>
          r.sourceId === targetId && r.targetId === sib.targetId && r.type === "Sibling of" && r.status === "Active")) {
          const sibId = `rel-sib-${Date.now()}-${sib.targetId}`;
          _relationships = [
            ..._relationships,
            { id: sibId, sourceId: targetId, targetId: sib.targetId, type: "Sibling of", status: "Active" },
            { id: `${sibId}-inv`, sourceId: sib.targetId, targetId, type: "Sibling of", status: "Active" },
          ];
        }
      });
    }

    notify();
  },

  removeRelationship(relationshipId: string): void {
    const rel = _relationships.find((r) => r.id === relationshipId);
    if (!rel) return;
    const now = new Date().toISOString();

    // Remove both directions
    _relationships = _relationships.map((r) => {
      if (r.id === relationshipId) return { ...r, status: "Removed" as const };
      // Remove inverse
      if (r.sourceId === rel.targetId && r.targetId === rel.sourceId && r.type === getInverseRelationshipType(rel.type)) {
        return { ...r, status: "Removed" as const };
      }
      return r;
    });

    // Log on both contacts
    const src = _contacts.find((c) => c.id === rel.sourceId);
    const tgt = _contacts.find((c) => c.id === rel.targetId);
    const addEvent = (cid: string, desc: string) => {
      _contacts = _contacts.map((c) =>
        c.id === cid
          ? { ...c, timeline: [...c.timeline, { id: `${cid}-ev${Date.now()}`, contactId: cid, type: "Relationship Removed" as ActivityEventType, description: desc, sourceModule: "CRM", timestamp: now }] }
          : c
      );
    };
    if (src && tgt) {
      addEvent(rel.sourceId, `Unlinked from ${tgt.name}.`);
      addEvent(rel.targetId, `Unlinked from ${src.name}.`);
    }

    notify();
  },

  // ── Notes ──

  addNote(contactId: string, content: string, author: string, propagateTo: string[] = []): void {
    const now = new Date().toISOString();
    const note: ContactNote = {
      id: `note-${Date.now()}`, contactId, content, author,
      createdAt: now, propagatedTo: propagateTo,
    };
    const addNoteToContact = (cid: string) => {
      _contacts = _contacts.map((c) => {
        if (c.id !== cid) return c;
        return {
          ...c,
          notes: [...c.notes, note],
          timeline: [...c.timeline, {
            id: `${cid}-ev${Date.now()}`, contactId: cid, type: "Note Added" as ActivityEventType,
            description: `Note added by ${author}.`, sourceModule: "CRM",
            staffMember: author, timestamp: now,
          }],
        };
      });
    };
    addNoteToContact(contactId);
    propagateTo.forEach(addNoteToContact);
    notify();
  },

  // ── Tasks ──

  addTask(contactId: string, task: Omit<ContactTask, "id" | "contactId" | "createdAt" | "status">): void {
    const now = new Date().toISOString();
    const newTask: ContactTask = {
      ...task, id: `task-${Date.now()}`, contactId, status: "Open", createdAt: now,
    };
    _contacts = _contacts.map((c) => {
      if (c.id !== contactId) return c;
      return {
        ...c,
        tasks: [...c.tasks, newTask],
        timeline: [...c.timeline, {
          id: `${c.id}-ev${Date.now()}`, contactId: c.id, type: "Task Created" as ActivityEventType,
          description: `Task created: "${task.title}".`, sourceModule: "CRM",
          staffMember: task.assignedTo, timestamp: now,
        }],
      };
    });
    notify();
  },

  completeTask(contactId: string, taskId: string): void {
    const now = new Date().toISOString();
    _contacts = _contacts.map((c) => {
      if (c.id !== contactId) return c;
      return {
        ...c,
        tasks: c.tasks.map((t) => t.id === taskId ? { ...t, status: "Completed" as const } : t),
        timeline: [...c.timeline, {
          id: `${c.id}-ev${Date.now()}`, contactId: c.id, type: "Task Completed" as ActivityEventType,
          description: `Task completed.`, sourceModule: "CRM", timestamp: now,
        }],
      };
    });
    notify();
  },

  // ── Merge ──

  merge(primaryId: string, secondaryId: string, resolvedFields: Partial<FullContact>): void {
    const primary = _contacts.find((c) => c.id === primaryId);
    const secondary = _contacts.find((c) => c.id === secondaryId);
    if (!primary || !secondary) return;

    const now = new Date().toISOString();
    const merged: FullContact = {
      ...primary,
      ...resolvedFields,
      tags: [
        ...primary.tags,
        ...secondary.tags.filter((t) => !primary.tags.some((p) => p.label === t.label)),
      ],
      notes: [...primary.notes, ...secondary.notes],
      tasks: [...primary.tasks, ...secondary.tasks],
      attributions: [...primary.attributions, ...secondary.attributions],
      timeline: [
        ...primary.timeline,
        ...secondary.timeline,
        {
          id: `${primaryId}-ev-merge-${Date.now()}`, contactId: primaryId,
          type: "Contact Merged" as ActivityEventType,
          description: `Merged with ${secondary.name} (ID: ${secondaryId}). All data consolidated.`,
          sourceModule: "CRM", timestamp: now,
        },
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    };

    // Re-point relationships from secondary to primary
    _relationships = _relationships.map((r) => {
      if (r.sourceId === secondaryId) return { ...r, sourceId: primaryId };
      if (r.targetId === secondaryId) return { ...r, targetId: primaryId };
      return r;
    });

    // Archive secondary
    _contacts = _contacts.map((c) => {
      if (c.id === primaryId) return merged;
      if (c.id === secondaryId) return { ...c, status: "Archived" as const };
      return c;
    });

    // Update duplicate records
    _duplicates = _duplicates.map((d) => {
      if ((d.contactAId === primaryId && d.contactBId === secondaryId) ||
          (d.contactAId === secondaryId && d.contactBId === primaryId)) {
        return { ...d, status: "Merged" as const };
      }
      return d;
    });

    notify();
  },

  // ── Duplicates ──

  getDuplicates(statusFilter: DuplicatePair["status"][] = ["Pending"]): Array<DuplicatePair & { contactA: FullContact; contactB: FullContact }> {
    return _duplicates
      .filter((d) => statusFilter.includes(d.status))
      .map((d) => {
        const contactA = _contacts.find((c) => c.id === d.contactAId);
        const contactB = _contacts.find((c) => c.id === d.contactBId);
        if (!contactA || !contactB) return null;
        return { ...d, contactA, contactB };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
  },

  dismissDuplicate(duplicateId: string): void {
    _duplicates = _duplicates.map((d) =>
      d.id === duplicateId ? { ...d, status: "Dismissed" as const } : d
    );
    notify();
  },

  // ── Import ──

  bulkCreate(contacts: Array<Omit<FullContact, "id" | "timeline" | "notes" | "tasks" | "attributions" | "engagementScoreValue">>): { created: number; flagged: number } {
    let created = 0;
    let flagged = 0;
    contacts.forEach((data) => {
      // Check for exact email match
      const exact = _contacts.find((c) => c.email.toLowerCase() === data.email.toLowerCase() && c.status !== "Archived");
      if (!exact) {
        contactStore.create({ ...data, source: data.source || "Import" });
        created++;
      } else {
        flagged++;
      }
    });
    notify();
    return { created, flagged };
  },
};

// ─── React hook ──────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

export function useContacts() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    return contactStore.subscribe(() => forceUpdate((n) => n + 1));
  }, []);
  return contactStore;
}
