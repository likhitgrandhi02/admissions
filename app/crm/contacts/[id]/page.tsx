"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ContactProfileView } from "@/components/contacts/contact-profile";
import {
  ArrowLeft,
  MoreVertical,
  Merge,
  Archive,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useContacts, type FullContact } from "@/lib/contact-store";
import { cn } from "@/lib/utils";

export default function ContactProfilePage() {
  const params = useParams();
  const router = useRouter();
  const store = useContacts();
  const id = params.id as string;
  const contact = store.getById(id);

  if (!contact) {
    return (
      <DashboardLayout
        pageHeader={
          <PageHeader
            title="Contact not found"
            actions={
              <Button variant="outline" size="md" onClick={() => router.push("/crm/contacts")}>
                <ArrowLeft className="w-4 h-4" /> Back to contacts
              </Button>
            }
          />
        }
      >
        <div className="flex items-center justify-center h-full text-text-secondary">
          This contact does not exist or has been archived.
        </div>
      </DashboardLayout>
    );
  }

  const pageHeader = (
    <PageHeader
      title={contact.name}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={() => router.push("/crm/contacts")}>
            <ArrowLeft className="w-4 h-4" />
            All contacts
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="md" className="px-2">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="text-[13px] gap-2"
                onClick={() => router.push(`/crm/contacts/${id}/merge`)}
              >
                <Merge className="w-3.5 h-3.5" />
                Merge with another
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[13px] gap-2 text-destructive"
                onClick={() => {
                  if (confirm("Archive this contact? They will no longer appear in the directory.")) {
                    store.archive(id);
                    router.push("/crm/contacts");
                  }
                }}
              >
                <Archive className="w-3.5 h-3.5" />
                Archive contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
  );

  return (
    <DashboardLayout pageHeader={pageHeader}>
      <ContactProfileView contact={contact} />
    </DashboardLayout>
  );
}
