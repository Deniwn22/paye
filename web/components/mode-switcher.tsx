"use client"

import { useState, useTransition } from "react"
import { switchModeAction } from "@/app/actions"
import { AlertTriangle, Play, ShieldAlert, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface ModeSwitcherProps {
  initialMode: "live" | "test"
}

export default function ModeSwitcher({ initialMode }: ModeSwitcherProps) {
  const [mode, setMode] = useState<"live" | "test">("test") // Enforce test mode as active
  const [showWarning, setShowWarning] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleToggleClick = (targetMode: "live" | "test") => {
    if (targetMode === "live") {
      setShowWarning(true)
    } else {
      setMode("test")
    }
  }

  return (
    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-xl text-xs font-bold transition-all relative">
      {/* Test Mode Option */}
      <button
        onClick={() => handleToggleClick("test")}
        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all select-none cursor-pointer ${
          mode === "test"
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm border border-amber-500/10"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border border-transparent"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${mode === "test" ? "bg-amber-500" : "bg-zinc-400"}`} />
        <span>Test Mode</span>
      </button>

      {/* Live Mode Option */}
      <button
        onClick={() => handleToggleClick("live")}
        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all select-none cursor-pointer text-zinc-450 dark:text-zinc-500 opacity-60 hover:opacity-100`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
        <span>Live Mode</span>
      </button>

      {/* Encouraging Warning Modal */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-6 shadow-none animate-in fade-in duration-150">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
              <ShieldAlert className="w-5.5 h-5.5 text-[#2563eb] shrink-0" />
              <span>Live Mode Coming Soon</span>
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-xs text-zinc-550 dark:text-zinc-400 mt-2.5 leading-relaxed space-y-3 font-sans">
                <p>
                  Live Mode is temporarily unavailable. We are actively working on Paye. to make it robust for real transactions.
                </p>
                <p>
                  Right now, you can start integrating and testing your payment flows in <strong>Test Mode</strong>. We will make Live Mode available again soon.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setShowWarning(false)}
              className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Okay
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
