"use client";

import { useState } from "react";
import { ModalShell } from "./modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactStore, type FullContact } from "@/lib/contact-store";
import { cn } from "@/lib/utils";

type Priority = "Low" | "Normal" | "High";

export function AddTaskModal({ contact, onClose }: { contact: FullContact; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("Current User");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("Normal");

  function handleSave() {
    if (!title.trim()) return;
    contactStore.addTask(contact.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      assignedTo,
      dueDate: dueDate || undefined,
      priority,
    });
    onClose();
  }

  return (
    <ModalShell
      title="Add task"
      subtitle={`Create a follow-up task for ${contact.name}.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>Cancel</Button>
          <Button size="md" onClick={handleSave} disabled={!title.trim()}>Add task</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Task title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
            placeholder="e.g. Send application pack"
            className="h-9 text-[14px]"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details…"
            rows={3}
            className="w-full border border-border-secondary rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-interactive-primary/30 focus:border-interactive-primary transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Assigned to</label>
            <Input
              value={assignedTo}
              onChange={(e) => setAssignedTo((e.target as HTMLInputElement).value)}
              className="h-9 text-[14px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Due date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate((e.target as HTMLInputElement).value)}
              className="h-9 text-[14px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-text-primary mb-1.5">Priority</label>
          <div className="flex gap-2">
            {(["Low", "Normal", "High"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[13px] border transition-colors",
                  priority === p
                    ? p === "High"
                      ? "border-[#b0000a] bg-[#fde8e9] text-[#b0000a]"
                      : p === "Low"
                        ? "border-text-secondary bg-[#f0f0f0] text-text-secondary"
                        : "border-interactive-primary bg-[#fff5f5] text-interactive-primary"
                    : "border-border-secondary hover:bg-[#fafafa] text-text-primary"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
