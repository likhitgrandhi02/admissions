"use client"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Settings } from "lucide-react"

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface NavItem {
  label: string
  href: string
  active?: boolean
}

export interface NavSection {
  header: string
  items: NavItem[]
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-5 py-2">
      <span className="text-[14px] font-semibold text-[var(--text-primary)] leading-5 truncate block">
        {label}
      </span>
    </div>
  )
}

function NavItemRow({ item }: { item: NavItem }) {
  return (
    <a
      href={item.href}
      className={cn(
        "flex items-center gap-2 px-5 py-2 w-full",
        "text-[14px] font-medium text-[var(--text-primary)] leading-5",
        "hover:bg-[var(--surface-secondary)] transition-colors",
        item.active && "bg-[var(--surface-secondary)]",
      )}
    >
      <span className="truncate">{item.label}</span>
    </a>
  )
}

function NavSection({ section }: { section: NavSection }) {
  return (
    <div className="flex flex-col gap-1">
      <SectionHeader label={section.header} />
      {section.items.map((item) => (
        <NavItemRow key={item.href} item={item} />
      ))}
    </div>
  )
}

/* ─── Default nav config ────────────────────────────────────────────────── */

const DEFAULT_SECTIONS: NavSection[] = [
  {
    header: "CRM",
    items: [
      { label: "Contact directory", href: "/crm/contacts", active: true },
      { label: "Segments and audiences", href: "/crm/segments" },
      { label: "Deduplication", href: "/crm/deduplication" },
      { label: "CRM analytics", href: "/crm/analytics" },
    ],
  },
  {
    header: "Applications",
    items: [
      { label: "All applications", href: "/applications" },
      { label: "Review pipeline", href: "/applications/review" },
    ],
  },
  {
    header: "Communications",
    items: [
      { label: "Email campaigns", href: "/comms/email" },
      { label: "Templates", href: "/comms/templates" },
    ],
  },
  {
    header: "Settings",
    items: [
      { label: "General", href: "/settings/general" },
      { label: "Team & permissions", href: "/settings/team" },
    ],
  },
]

/* ─── Main SideNav ───────────────────────────────────────────────────────── */

interface SideNavProps {
  sections?: NavSection[]
  className?: string
}

export function SideNav({ sections = DEFAULT_SECTIONS, className }: SideNavProps) {
  return (
    <aside
      className={cn(
        "w-60 h-full bg-white border-r border-[var(--border-secondary)]",
        "flex flex-col shrink-0 overflow-hidden",
        className,
      )}
    >
      {/* Spacer matching header padding */}
      <div className="h-1" />

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0">
        {sections.map((section, i) => (
          <div key={section.header} className="flex flex-col">
            <NavSection section={section} />
            {i < sections.length - 1 && (
              <div className="py-1">
                <Separator className="bg-[var(--border-secondary)]" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0">
        <Separator className="bg-[var(--border-secondary)]" />
        <button className="flex items-center gap-2 px-5 py-2 w-full hover:bg-[var(--surface-secondary)] transition-colors">
          <Settings className="size-5 text-[var(--text-secondary)] shrink-0" />
          <span className="text-[14px] font-medium text-[var(--text-primary)] leading-5">
            Settings
          </span>
        </button>
      </div>
    </aside>
  )
}
