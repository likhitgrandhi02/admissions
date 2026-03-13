"use client"

import {
  Bell,
  BookOpen,
  Calendar,
  ChevronDown,
  Search,
  Settings,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface GlobalHeaderProps {
  className?: string
}

function ToddleLogomark() {
  return (
    <Image src="/assets/ToddleColored.svg" alt="Toddle" width={20} height={20} />
  )
}

function UserAvatar() {
  return (
    <div className="size-7 rounded-full bg-[var(--decorative-yellow)] flex items-center justify-center overflow-hidden shrink-0">
      <span className="text-[10px] font-semibold text-[#1a1a1a] leading-none">LG</span>
    </div>
  )
}

export function GlobalHeader({ className }: GlobalHeaderProps) {
  return (
    <header
      className={cn(
        "h-10 bg-[var(--header-bg)] border-b border-[var(--header-border)] flex items-center justify-between px-2 shrink-0 relative z-50",
        className,
      )}
    >
      {/* Left: Logo + App name */}
      <div className="flex items-center gap-1 h-10">
        <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors">
          <ToddleLogomark />
        </button>
        <div className="flex items-center gap-1">
          <span className="text-[14px] font-semibold text-[var(--text-on-header)] leading-5 whitespace-nowrap">
            Toddle Admissions
          </span>
          <ChevronDown className="size-3.5 text-white/60" />
        </div>
      </div>

      {/* Center: Search */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        {/* Nav pill */}
        <div className="bg-[var(--surface-tertiary)] p-0.5 rounded-md">
          <button className="flex items-center justify-center p-0.5 rounded-md hover:bg-white/10 transition-colors">
            <BookOpen className="size-5 text-white/80" />
          </button>
        </div>
        {/* Search input */}
        <div className="bg-[var(--surface-tertiary)] h-7 flex items-center px-2 py-1 rounded-md w-[220px] gap-2">
          <Search className="size-4 text-white/60 shrink-0" />
          <span className="flex-1 text-[12px] text-white/60 leading-4">Search...</span>
          <span className="text-[12px] text-white/50 shrink-0">⌘/</span>
        </div>
      </div>

      {/* Right: Action icons + avatar */}
      <div className="flex items-center gap-1">
        <button className="flex items-center justify-center p-2 rounded-md hover:bg-white/10 transition-colors relative">
          <Bell className="size-5 text-white/80" />
          <span className="absolute top-1 right-1 bg-[var(--interactive-primary)] text-white text-[10px] font-semibold leading-4 px-1 rounded-full min-w-[16px] text-center">
            9
          </span>
        </button>
        <button className="flex items-center justify-center p-2 rounded-md hover:bg-white/10 transition-colors">
          <Calendar className="size-5 text-white/80" />
        </button>
        <button className="flex items-center justify-center p-2 rounded-md hover:bg-white/10 transition-colors">
          <Settings className="size-5 text-white/80" />
        </button>

        <div className="w-px h-[26.5px] bg-white/20 mx-1" />

        <button className="rounded-full hover:ring-2 hover:ring-white/30 transition-all">
          <UserAvatar />
        </button>
      </div>
    </header>
  )
}
