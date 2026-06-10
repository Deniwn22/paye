"use client"

import { useActionState } from "react"
import Link from "next/link"
import { signUpAction } from "@/app/actions"
import { AlertCircle } from "lucide-react"

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 font-sans selection:bg-[#eff6ff] selection:text-[#2563eb]">
      <div className="w-full max-w-sm rounded-xl border-[0.5px] border-border bg-card p-8">
        
        {/* Brand Logo Header */}
        <div className="mb-6 flex flex-col items-center">
          <Link href="/" className="text-xl font-bold tracking-tight text-foreground select-none">
            Paye<span className="text-[#2563eb] dark:text-[#3b82f6]">.</span>
          </Link>
          <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">
            Create your account
          </h2>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Register your merchant company to start routing.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Merchant Name
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full rounded-lg border-[0.5px] border-border bg-secondary px-3 py-2.5 text-xs text-foreground placeholder-zinc-400 dark:placeholder-zinc-650 transition-colors focus:border-primary focus:outline-none"
              placeholder="Merchant / Company Name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border-[0.5px] border-border bg-secondary px-3 py-2.5 text-xs text-foreground placeholder-zinc-400 dark:placeholder-zinc-650 transition-colors focus:border-primary focus:outline-none"
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-lg border-[0.5px] border-border bg-secondary px-3 py-2.5 text-xs text-foreground placeholder-zinc-400 dark:placeholder-zinc-650 transition-colors focus:border-primary focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-[#1d4ed8] dark:hover:bg-[#2563eb] disabled:opacity-50"
          >
            {isPending ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold text-primary hover:text-primary-hover hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
