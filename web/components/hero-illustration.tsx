"use client"

import { useState } from "react"
import { Shield, Check, ArrowUpRight, Activity } from "lucide-react"

export default function HeroIllustration() {
  const [clicked, setClicked] = useState(false)

  const handlePayClick = () => {
    if (clicked) return
    setClicked(true)
    setTimeout(() => setClicked(false), 3000)
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      {/* Container with relative boundaries for floating cards */}
      <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
        
        {/* Floating Card 1: Routing Status */}
        <div className="absolute top-0 -left-6 z-10 bg-white/70 dark:bg-[#0d0d11]/70 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl rounded-full py-1.5 px-3.5 flex items-center gap-2 animate-float text-xs font-semibold select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-zinc-600 dark:text-zinc-300">Routing Live</span>
        </div>

        {/* Floating Card 2: Successful Transaction */}
        <div className="absolute top-8 -right-12 z-10 bg-white/85 dark:bg-[#0d0d11]/85 backdrop-blur-md border border-zinc-200/60 dark:border-zinc-800/60 shadow-2xl rounded-2xl p-3 flex items-center gap-3 animate-float-delayed select-none w-48">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Payment
            </span>
            <span className="block text-xs font-black text-zinc-800 dark:text-white truncate">
              ₦12,500.00
            </span>
            <span className="block text-[9px] text-zinc-500 font-mono">
              Paystack • Success
            </span>
          </div>
        </div>

        {/* Floating Card 3: Payout Capsule */}
        <div className="absolute bottom-8 -left-10 z-10 bg-white/80 dark:bg-[#0d0d11]/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl rounded-2xl p-3 flex items-center gap-3 animate-float select-none w-44">
          <div className="w-8 h-8 rounded-full bg-sky-500/15 text-sky-500 flex items-center justify-center font-bold text-xs shrink-0">
            P
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Payout
            </span>
            <span className="block text-xs font-black text-zinc-850 dark:text-white truncate">
              ₦45,000 sent
            </span>
            <span className="block text-[9px] text-zinc-500 font-mono">
              Wema Bank
            </span>
          </div>
        </div>

        {/* Orbit SVG Map */}
        <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible select-none">
          {/* Defs for gradients & glows */}
          <defs>
            <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {/* Central hub background glow */}
          <circle cx="200" cy="200" r="80" fill="url(#hubGlow)" />

          {/* Inner orbit dash lines */}
          <circle cx="200" cy="200" r="115" stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" className="text-zinc-200 dark:text-zinc-800" />
          
          {/* Connector 1: Flutterwave (Top) -> Paye */}
          <path d="M 200 80 L 200 150" stroke="url(#neonGlow)" strokeWidth="6" strokeLinecap="round" opacity="0.25" className="flowing-path" />
          <path d="M 200 80 L 200 150" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" className="flowing-path" />
          
          {/* Connector 2: Paystack (Right) -> Paye */}
          <path d="M 320 200 L 250 200" stroke="url(#neonGlow)" strokeWidth="6" strokeLinecap="round" opacity="0.25" className="flowing-path" />
          <path d="M 320 200 L 250 200" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" className="flowing-path" />
          
          {/* Connector 3: Monnify (Bottom) -> Paye */}
          <path d="M 200 320 L 200 250" stroke="url(#neonGlow)" strokeWidth="6" strokeLinecap="round" opacity="0.25" className="flowing-path" />
          <path d="M 200 320 L 200 250" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" className="flowing-path" />
          
          {/* Connector 4: More (Left) -> Paye */}
          <path d="M 80 200 L 150 200" stroke="url(#neonGlow)" strokeWidth="6" strokeLinecap="round" opacity="0.25" className="flowing-path" />
          <path d="M 80 200 L 150 200" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" className="flowing-path" />

          {/* Central Hub: Paye */}
          <g transform="translate(155, 155)">
            {/* Base Glowing Rings */}
            <circle cx="45" cy="45" r="42" fill="var(--background)" stroke="#0ea5e9" strokeWidth="2.5" className="shadow-lg" />
            <circle cx="45" cy="45" r="35" fill="var(--background)" className="dark:fill-[#0d0d11]" />
            <rect x="30" y="30" width="30" height="30" rx="8" fill="url(#neonGlow)" className="shadow-md" />
            <text x="45" y="51" fill="#ffffff" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">P</text>
          </g>

          {/* Node 1: Flutterwave (Top) */}
          <g transform="translate(176, 56)">
            <circle cx="24" cy="24" r="24" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" className="text-zinc-200 dark:text-zinc-800 dark:fill-[#121212]" />
            {/* Custom styled Flutterwave-like emblem */}
            <path d="M 17 22 L 24 16 L 31 22 L 24 28 Z" fill="#ffc700" />
            <text x="24" y="38" fill="currentColor" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="sans-serif" className="text-zinc-800 dark:text-zinc-200">FW</text>
          </g>

          {/* Node 2: Paystack (Right) */}
          <g transform="translate(296, 176)">
            <circle cx="24" cy="24" r="24" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" className="text-zinc-200 dark:text-zinc-800 dark:fill-[#121212]" />
            <rect x="16" y="16" width="16" height="3" rx="1.5" fill="#38bdf8" />
            <rect x="16" y="22" width="16" height="3" rx="1.5" fill="#38bdf8" />
            <rect x="16" y="28" width="16" height="3" rx="1.5" fill="#38bdf8" />
          </g>

          {/* Node 3: Monnify (Bottom) */}
          <g transform="translate(176, 296)">
            <circle cx="24" cy="24" r="24" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" className="text-zinc-200 dark:text-zinc-800 dark:fill-[#121212]" />
            <path d="M 16 30 L 16 19 L 22 25 L 26 25 L 32 19 L 32 30" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Node 4: More (Left) */}
          <g transform="translate(56, 176)">
            <circle cx="24" cy="24" r="24" fill="var(--secondary)" stroke="currentColor" strokeWidth="1.5" className="text-zinc-200 dark:text-zinc-800" />
            <text x="24" y="29" fill="var(--foreground)" fontSize="15" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">+</text>
          </g>
        </svg>
      </div>

      {/* Mock Checkout Button */}
      <div className="mt-6 flex flex-col items-center gap-2 w-full max-w-[280px]">
        <button
          onClick={handlePayClick}
          className={`relative overflow-hidden w-full py-3 text-sm font-extrabold rounded-2xl text-white transition-all shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center group/btn ${
            clicked 
              ? "bg-emerald-500 shadow-emerald-500/20" 
              : "bg-sky-500 hover:bg-sky-450 shadow-sky-500/20 hover:shadow-sky-500/30"
          }`}
        >
          {/* Subtle button glare shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
          
          {clicked ? (
            <span className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
              <Check className="w-4 h-4 stroke-[3]" />
              Payment Successful
            </span>
          ) : (
            <span>Pay ₦5,000</span>
          )}
        </button>
        <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider select-none mt-1">
          <Shield className="w-3.5 h-3.5 text-sky-500" />
          <span>Secured by Paye Engine</span>
        </div>
      </div>
    </div>
  )
}
