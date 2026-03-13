import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  actions?: React.ReactNode
  className?: string
}

/**
 * PageHeader — 48px header bar rendered between the global nav and page content.
 * Matches Figma "Header | Page centered/Full page" (node 11:13746).
 *
 * Layout: title flush-left · actions flush-right
 */
export function PageHeader({ title, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "pt-4 shrink-0",
        className,
      )}
    >
      <div className="h-12 flex items-center justify-between px-6 bg-white">
        <h1 className="text-[18px] font-bold leading-7 text-[var(--text-primary)] tracking-normal">
          {title}
        </h1>
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}
