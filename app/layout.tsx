import { Geist_Mono } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const fontSans = localFont({
  src: [
    { path: "../public/AvenirNext-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/AvenirNext-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/AvenirNext-DemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/AvenirNext-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, fontSans.variable, "font-sans")}
    >
      <body className="overflow-hidden">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
