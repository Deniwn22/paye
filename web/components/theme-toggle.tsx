"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-8 h-8 rounded-md border border-zinc-200 dark:border-[#222] bg-zinc-50 dark:bg-[#111]" />
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="p-2 border border-zinc-200 dark:border-[#222] hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-[#111] hover:bg-zinc-100 dark:hover:bg-[#1b1b1b] text-zinc-600 dark:text-zinc-400 rounded-md transition-all cursor-pointer"
      title="Toggle theme (hotkey: D)"
      aria-label="Toggle Theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-sky-500" />
      )}
    </button>
  )
}
