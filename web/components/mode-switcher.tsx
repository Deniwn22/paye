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
  const [mode, setMode] = useState<"live" | "test">(initialMode)
  const [showWarning, setShowWarning] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleToggleClick = (targetMode: "live" | "test") => {
    if (targetMode === mode) return

    if (targetMode === "live") {
      setShowWarning(true)
    } else {
      performSwitch("test")
    }
  }

  const performSwitch = (targetMode: "live" | "test") => {
    startTransition(async () => {
      try {
        const res = await switchModeAction(targetMode)
        if (res.success) {
          setMode(targetMode)
          toast.success(`Switched to ${targetMode === "live" ? "Live Production" : "Test Sandbox"} Mode`)
          setShowWarning(false)
          // Reload page to re-fetch data for the new mode
          setTimeout(() => {
            window.location.reload()
          }, 400)
        } else {
          toast.error("Failed to switch environment mode")
        }
      } catch (err) {
        toast.error("An error occurred while switching modes")
      }
    })
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
        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all select-none cursor-pointer ${
          mode === "live"
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/10"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border border-transparent"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${mode === "live" ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
        <span>Live Mode</span>
      </button>

      {/* Encouraging Warning Modal */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base font-extrabold text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5.5 h-5.5 text-amber-500 shrink-0" />
              <span>Activate Live Production Mode</span>
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2.5 leading-relaxed space-y-3 font-sans">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  ⚠️ Production Mode Active
                </p>
                <p>
                  Production gateway services are active. Please note that we are actively building and expanding production features. We recommend testing your integration flows thoroughly in test mode first.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4 flex justify-end gap-2.5">
            <button
              onClick={() => setShowWarning(false)}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg font-bold text-zinc-700 dark:text-zinc-300 text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => performSwitch("live")}
              disabled={isPending}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all text-xs flex items-center gap-1.5"
            >
              {isPending ? (
                "Activating..."
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Activate Live Mode</span>
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
