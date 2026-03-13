import { GlobalHeader } from "./global-header"
import { SideNav, type NavSection } from "./side-nav"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  /** Override the default sidebar navigation sections */
  navSections?: NavSection[]
  /** Additional class names for the main content area */
  contentClassName?: string
  /** Page-level header bar rendered between global nav and content (PageHeader component) */
  pageHeader?: React.ReactNode
}

/**
 * DashboardLayout — base template for all Toddle Admissions modules.
 *
 * Structure:
 *  ┌──────────────── Global Header (40px) ────────────────┐
 *  │                                                        │
 *  ├── Side Nav (240px) ──┬──── Main Content (flex-1) ─────┤
 *  │                      │                                 │
 *  │  CRM                 │                                 │
 *  │    Contact directory │                                 │
 *  │    Segments…         │  {children}                     │
 *  │    …                 │                                 │
 *  │  [Settings footer]   │                                 │
 *  └──────────────────────┴─────────────────────────────────┘
 */
export function DashboardLayout({
  children,
  navSections,
  contentClassName,
  pageHeader,
}: DashboardLayoutProps) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--surface-primary)]">
      {/* Global top navigation bar */}
      <GlobalHeader />

      {/* Body: sidebar + main content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar */}
        <SideNav sections={navSections} />

        {/* Main content area */}
        <main
          className={cn(
            "flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-[var(--surface-primary)]",
            contentClassName,
          )}
        >
          {/* Optional page-level header (title + actions bar) */}
          {pageHeader}

          {/* Scrollable page content */}
          <div className="flex-1 min-h-0 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
