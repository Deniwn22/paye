"use client"

import { useActionState } from "react"
import Link from "next/link"
import { signUpAction } from "@/app/actions"
import { ShieldCheck, UserPlus, ArrowRight, AlertCircle } from "lucide-react"

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, null)

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-50 p-6 font-sans text-zinc-900 transition-colors duration-300 selection:bg-sky-500/20 selection:text-sky-400 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Background Radial Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/5 blur-3xl dark:bg-sky-500/10" />
      <div className="pointer-events-none absolute inset-0 top-0 bg-[linear-gradient(to_right,rgba(120,119,198,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.01)_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(to_right,rgba(120,119,198,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.02)_1px,transparent_1px)]" />

      <div className="relative z-10 w-full max-w-md animate-in rounded-2xl border border-zinc-200 bg-white p-8 shadow-2xl backdrop-blur-md duration-200 zoom-in-95 fade-in dark:border-zinc-800 dark:bg-zinc-900/60">
        {/* Brand Logo Header */}
        <div className="mt-2 mb-8 flex flex-col items-center">
          <Link href="/" className="group mb-4 flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-sm font-black text-black shadow-md shadow-sky-500/10 transition-transform group-hover:scale-105">
              P
            </span>
            <span className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Paye
            </span>
          </Link>
          <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-1 max-w-xs text-center text-[11px] leading-normal text-zinc-500 dark:text-zinc-500">
            Register your merchant company to initialize the payment router
            integration.
          </p>
        </div>

        <form action={formAction} className="space-y-5">
          {state?.error && (
            <div className="shake flex animate-in items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-semibold text-rose-600 duration-200 dark:text-rose-400">
              <AlertCircle className="text-rose-550 h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Merchant Name
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 font-sans text-xs text-zinc-900 placeholder-zinc-400 transition-colors focus:border-sky-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-700"
              placeholder="Merchant / Company Name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 font-sans text-xs text-zinc-900 placeholder-zinc-400 transition-colors focus:border-sky-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-700"
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 font-sans text-xs text-zinc-900 placeholder-zinc-400 transition-colors focus:border-sky-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-700"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-sky-500 py-3 text-xs font-extrabold text-black shadow-lg shadow-sky-500/10 transition-all select-none hover:scale-[1.01] hover:bg-sky-400 hover:shadow-sky-500/20 active:scale-[0.99] disabled:opacity-50"
          >
            {isPending ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-bold text-sky-600 transition-colors hover:underline dark:text-sky-400"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
