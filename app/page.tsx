"use client"

import { useEffect } from "react"

export default function RootPage() {
  useEffect(() => {
    window.location.replace("/crm/contacts")
  }, [])
  return null
}
