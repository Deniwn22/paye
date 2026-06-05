"use client"

import { useState } from "react"
import { Shield } from "lucide-react"

export default function HeroIllustration() {
  const [clicked, setClicked] = useState(false)

  const handlePayClick = () => {
    setClicked(true)
    setTimeout(() => setClicked(false), 2000)
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      
      {/* SVG orbit map */}
      <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
        
        <style jsx global>{`
          @keyframes flow-inward {
            from {
              stroke-dashoffset: 0;
            }
            to {
              stroke-dashoffset: 20;
            }
          }
          .flowing-path {
            stroke-dasharray: 4 6;
            animation: flow-inward 2s linear infinite;
          }
        `}</style>

        <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
          {/* Inner orbit boundary rings */}
          <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="1" className="text-zinc-200 dark:text-zinc-850 stroke-dasharray-[2_4]" />
          
          {/* Connecting line 1: Flutterwave (Top) -> Paye */}
          <path d="M 200 80 L 200 150" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" className="flowing-path" />
          
          {/* Connecting line 2: Paystack (Right) -> Paye */}
          <path d="M 320 200 L 250 200" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" className="flowing-path" />
          
          {/* Connecting line 3: Monnify (Bottom) -> Paye */}
          <path d="M 200 320 L 200 250" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" className="flowing-path" />
          
          {/* Connecting line 4: More (Left) -> Paye */}
          <path d="M 80 200 L 150 200" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" className="flowing-path" />

          {/* Central Hub: Paye */}
          <g transform="translate(160, 160)">
            {/* White/Dark base container */}
            <circle cx="40" cy="40" r="38" fill="var(--background)" stroke="#0ea5e9" strokeWidth="2.5" className="shadow-sm" />
            <rect x="25" y="25" width="30" height="30" rx="6" fill="#0ea5e9" />
            <text x="40" y="46" fill="#ffffff" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">P</text>
          </g>

          {/* Node 1: Flutterwave (Top) */}
          <g transform="translate(176, 56)">
            <circle cx="24" cy="24" r="24" fill="#ffcd00" stroke="currentColor" strokeWidth="1.5" className="text-zinc-200 dark:text-zinc-800" />
            {/* Custom stylized wave F logo */}
            <path d="M 17 21 L 24 15 L 31 21 L 24 27 Z" fill="#f5a623" />
            <text x="24" y="38" fill="#111111" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">FW</text>
          </g>

          {/* Node 2: Paystack (Right) */}
          <g transform="translate(296, 176)">
            <circle cx="24" cy="24" r="24" fill="#09a5db" stroke="currentColor" strokeWidth="1.5" className="text-zinc-200 dark:text-zinc-800" />
            {/* Paystack stacked lines symbol */}
            <rect x="16" y="15" width="16" height="3" rx="1.5" fill="#ffffff" />
            <rect x="16" y="21" width="16" height="3" rx="1.5" fill="#ffffff" />
            <rect x="16" y="27" width="16" height="3" rx="1.5" fill="#ffffff" />
          </g>

          {/* Node 3: Monnify (Bottom) */}
          <g transform="translate(176, 296)">
            <circle cx="24" cy="24" r="24" fill="#1c2b5c" stroke="currentColor" strokeWidth="1.5" className="text-zinc-200 dark:text-zinc-800" />
            {/* Monnify M symbol */}
            <path d="M 16 30 L 16 18 L 22 25 L 26 25 L 32 18 L 32 30" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Node 4: More (Left) */}
          <g transform="translate(56, 176)">
            <circle cx="24" cy="24" r="24" fill="var(--secondary)" stroke="currentColor" strokeWidth="1.5" className="text-zinc-200 dark:text-zinc-800" />
            <text x="24" y="28" fill="var(--foreground)" fontSize="14" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">+</text>
          </g>
        </svg>
      </div>

      {/* Mock checkout button */}
      <div className="mt-4 flex flex-col items-center gap-2 w-full max-w-[280px]">
        <button
          onClick={handlePayClick}
          className={`w-full py-3 text-sm font-extrabold rounded-xl text-white transition-all shadow-md select-none cursor-pointer flex items-center justify-center ${
            clicked ? "bg-emerald-500 scale-[0.98]" : "bg-sky-500 hover:bg-sky-450 active:scale-[0.98]"
          }`}
        >
          {clicked ? "Payment Successful" : "Pay ₦5,000"}
        </button>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-sky-500" />
          <span>Secured by Paye</span>
        </div>
      </div>
    </div>
  )
}
