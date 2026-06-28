"use client"

import { useState, useTransition, useEffect } from "react"
import Image from "next/image"
import { addProviderAction, deleteProviderAction, toggleProviderAction, getPaymentProvidersAction, togglePaymentProviderAction, updatePaymentProviderAction } from "@/app/actions"
import { Plus, Trash2, Key, HelpCircle, ShieldCheck, Check, AlertCircle, Eye, EyeOff, Radio, Sliders, Edit2, Copy, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export interface ProviderConfig {
  id: string
  label: string
  provider_name: string
  secret_key: string
  public_key: string
  test_secret_key: string
  test_public_key: string
  live_secret_key: string
  live_public_key: string
  test_webhook_secret?: string
  live_webhook_secret?: string
  is_active: boolean
}

interface PaymentProvider {
  id: string
  name: string
  label: string
  description: string
  is_supported: boolean
  test_credentials?: string
  notes?: string
}

export default function ProvidersManager({ initialProviders = [], userRole = "merchant" }: { initialProviders?: ProviderConfig[], userRole?: string }) {
  const [providers, setProviders] = useState<ProviderConfig[]>(initialProviders || [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addStep, setAddStep] = useState(1)
  const [isPending, startTransition] = useTransition()

  // Form states
  const [label, setLabel] = useState("")
  const [providerName, setProviderName] = useState("paystack")
  const [testSecretKey, setTestSecretKey] = useState("")
  const [testPublicKey, setTestPublicKey] = useState("")
  const [testWebhookSecret, setTestWebhookSecret] = useState("")
  const [liveSecretKey, setLiveSecretKey] = useState("")
  const [livePublicKey, setLivePublicKey] = useState("")
  const [liveWebhookSecret, setLiveWebhookSecret] = useState("")
  const [accountId, setAccountId] = useState("")

  // Admin Editing States
  const [adminEditingProvider, setAdminEditingProvider] = useState<PaymentProvider | null>(null)
  const [adminDescription, setAdminDescription] = useState("")
  const [adminTestCredentials, setAdminTestCredentials] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [adminIsSupported, setAdminIsSupported] = useState(true)

  const startAdminEdit = (prov: PaymentProvider) => {
    setAdminEditingProvider(prov)
    setAdminDescription(prov.description || "")
    setAdminTestCredentials(prov.test_credentials || "")
    setAdminNotes(prov.notes || "")
    setAdminIsSupported(prov.is_supported)
  }

  const handleAdminEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminEditingProvider) return

    if (adminTestCredentials) {
      try {
        JSON.parse(adminTestCredentials)
      } catch (err) {
        toast.error("Test credentials must be a valid JSON string")
        return
      }
    }

    startTransition(async () => {
      const res = await updatePaymentProviderAction(adminEditingProvider.name, {
        description: adminDescription,
        test_credentials: adminTestCredentials,
        notes: adminNotes,
        is_supported: adminIsSupported,
      })

      if (!res.success) {
        toast.error(res.error || "Failed to update provider details")
      } else {
        toast.success(res.message || "Provider details updated successfully")
        setAdminEditingProvider(null)
        setSupportedProviders(
          supportedProviders.map((p) => {
            if (p.name === adminEditingProvider.name) {
              return {
                ...p,
                description: adminDescription,
                test_credentials: adminTestCredentials,
                notes: adminNotes,
                is_supported: adminIsSupported,
              }
            }
            return p
          })
        )
      }
    })
  }

  const [formTab, setFormTab] = useState<"test" | "live">("test")
  const [revealKeyId, setRevealKeyId] = useState<string | null>(null)
  const [revealType, setRevealType] = useState<"test" | "live">("test")

  const [supportedProviders, setSupportedProviders] = useState<PaymentProvider[]>([
    { id: "paystack", name: "paystack", label: "Paystack", description: "Popular African payment gateway.", is_supported: true },
    { id: "flutterwave", name: "flutterwave", label: "Flutterwave", description: "Seamless payments across Africa.", is_supported: true },
    { id: "nomba", name: "nomba", label: "Nomba", description: "Simplified business payments.", is_supported: false },
    { id: "opay", name: "opay", label: "OPay", description: "Vibrant checkout and mobile money payments.", is_supported: true },
  ])

  useEffect(() => {
    async function loadProviders() {
      const res = await getPaymentProvidersAction()
      if (res.success && res.data) {
        setSupportedProviders(res.data)
      }
    }
    loadProviders()
  }, [])

  const handleAdminToggle = async (name: string) => {
    const res = await togglePaymentProviderAction(name)
    if (!res.success) {
      toast.error(res.error || "Failed to toggle global provider support")
    } else {
      setSupportedProviders(
        supportedProviders.map((p) => {
          if (p.name === name) {
            const nextSupported = !p.is_supported
            toast.success(`Global support for ${p.label} has been ${nextSupported ? "enabled" : "disabled"}`)
            return { ...p, is_supported: nextSupported }
          }
          return p
        })
      )
    }
  }

  const validateKeys = (): boolean => {
    if (providerName === "paystack") {
      if (testSecretKey && !testSecretKey.startsWith("sk_test_")) {
        toast.error("Paystack test secret key must begin with 'sk_test_'")
        return false
      }
      if (testPublicKey && !testPublicKey.startsWith("pk_test_")) {
        toast.error("Paystack test public key must begin with 'pk_test_'")
        return false
      }
      if (liveSecretKey && !liveSecretKey.startsWith("sk_live_")) {
        toast.error("Paystack live secret key must begin with 'sk_live_'")
        return false
      }
      if (livePublicKey && !livePublicKey.startsWith("pk_live_")) {
        toast.error("Paystack live public key must begin with 'pk_live_'")
        return false
      }
    } else if (providerName === "flutterwave") {
      if (testSecretKey && !testSecretKey.startsWith("FLWSECK_TEST-")) {
        toast.error("Flutterwave test secret key must begin with 'FLWSECK_TEST-'")
        return false
      }
      if (testPublicKey && !testPublicKey.startsWith("FLWPUBK_TEST-")) {
        toast.error("Flutterwave test public key must begin with 'FLWPUBK_TEST-'")
        return false
      }
      if (liveSecretKey && (!liveSecretKey.startsWith("FLWSECK-") || liveSecretKey.includes("TEST"))) {
        toast.error("Flutterwave live secret key must begin with 'FLWSECK-' and cannot contain 'TEST'")
        return false
      }
      if (livePublicKey && (!livePublicKey.startsWith("FLWPUBK-") || livePublicKey.includes("TEST"))) {
        toast.error("Flutterwave live public key must begin with 'FLWPUBK-' and cannot contain 'TEST'")
        return false
      }
    }
    return true
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!label) {
      toast.error("Configuration label/name is required")
      return
    }

    if (!testSecretKey && !liveSecretKey) {
      toast.error("You must provide at least one secret key (Test or Live)")
      return
    }

    if (providerName === "nomba" && !accountId) {
      toast.error("Nomba Account ID is required")
      return
    }

    if (providerName === "opay" && !accountId) {
      toast.error("OPay Merchant ID is required")
      return
    }

    if (!validateKeys()) return

    const formData = new FormData()
    formData.append("label", label)
    formData.append("providerName", providerName)
    formData.append("testSecretKey", testSecretKey)
    formData.append("testPublicKey", testPublicKey)
    formData.append("testWebhookSecret", testWebhookSecret)
    formData.append("liveSecretKey", liveSecretKey)
    formData.append("livePublicKey", livePublicKey)
    formData.append("liveWebhookSecret", liveWebhookSecret)
    if (providerName === "nomba") {
      formData.append("metadata", JSON.stringify({ account_id: accountId }))
    } else if (providerName === "opay") {
      formData.append("metadata", JSON.stringify({ merchant_id: accountId }))
    }

    startTransition(async () => {
      const res = await addProviderAction(null, formData)
      if (!res.success) {
        toast.error(res.error || "Failed to add provider")
      } else {
        toast.success(res.message || "Provider registered successfully")
        setLabel("")
        setTestSecretKey("")
        setTestPublicKey("")
        setTestWebhookSecret("")
        setLiveSecretKey("")
        setLivePublicKey("")
        setLiveWebhookSecret("")
        setAccountId("")
        setDialogOpen(false)
        window.location.reload()
      }
    })
  }

  const handleToggle = async (id: string) => {
    const res = await toggleProviderAction(id)
    if (!res.success) {
      toast.error(res.error || "Failed to change provider status")
    } else {
      setProviders(
        providers.map((p) => {
          if (p.id === id) {
            const nextActive = !p.is_active
            toast.success(`${p.label} has been ${nextActive ? "enabled" : "disabled"}`)
            return { ...p, is_active: nextActive }
          }
          return p
        })
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment provider configuration?")) return

    const res = await deleteProviderAction(id)
    if (!res.success) {
      toast.error(res.error || "Failed to delete provider")
    } else {
      setProviders(providers.filter((p) => p.id !== id))
      toast.success("Provider configuration deleted successfully")
    }
  }

  const toggleRevealKey = (id: string, type: "test" | "live") => {
    if (revealKeyId === id && revealType === type) {
      setRevealKeyId(null)
    } else {
      setRevealKeyId(id)
      setRevealType(type)
    }
  }

  return (
    <div className="space-y-6 text-sm font-sans select-text">
      {userRole === "admin" && (
        <div className="p-6 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-500/20 rounded-2xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-indigo-500/25 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-500" />
                <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-150 uppercase tracking-wider">System Admin Controls</h2>
                <span className="text-[10px] font-bold text-white bg-indigo-600 dark:bg-indigo-700 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  Admin Panel
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                Toggle payment providers availability, edit notes, and modify credentials system-wide.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {supportedProviders.map((prov) => (
              <div
                key={prov.id}
                className={`p-4 border rounded-xl flex flex-col justify-between space-y-4 transition-all duration-300 ${
                  prov.is_supported
                    ? "bg-zinc-900/5 dark:bg-zinc-900/40 border-emerald-500/35 shadow-[0_2px_10px_rgba(16,185,129,0.04)]"
                    : "bg-zinc-150/40 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-900 opacity-80"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{prov.label}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${prov.is_supported ? "bg-emerald-500" : "bg-zinc-400"}`} />
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">{prov.description}</p>
                  
                  {prov.notes && (
                    <div className="text-[10px] text-zinc-650 dark:text-zinc-400 bg-zinc-200/20 dark:bg-zinc-800/25 p-2 rounded border border-zinc-200/30 dark:border-zinc-800/30">
                      <span className="font-bold text-[9px] text-indigo-500 block uppercase mb-0.5">Notes:</span>
                      {prov.notes}
                    </div>
                  )}

                  {prov.test_credentials && (
                    <div className="text-[10px] text-zinc-650 dark:text-zinc-400 bg-zinc-200/20 dark:bg-zinc-800/25 p-2 rounded border border-zinc-200/30 dark:border-zinc-800/30">
                      <span className="font-bold text-[9px] text-amber-500 block uppercase mb-0.5">Test Creds (JSON):</span>
                      <pre className="font-mono text-[9px] truncate">{prov.test_credentials}</pre>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/50 dark:border-zinc-850/50">
                  <button
                    onClick={() => startAdminEdit(prov)}
                    className="px-2 py-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 border border-indigo-500/20 rounded-md hover:bg-indigo-500/5 transition-all cursor-pointer"
                  >
                    Edit Details
                  </button>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase ${prov.is_supported ? "text-emerald-500" : "text-zinc-400"}`}>
                      {prov.is_supported ? "Active" : "Disabled"}
                    </span>
                    
                    {/* Custom Toggle Switch */}
                    <button
                      onClick={() => handleAdminToggle(prov.name)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                        prov.is_supported ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          prov.is_supported ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Edit Dialog */}
      <Dialog open={!!adminEditingProvider} onOpenChange={(open) => !open && setAdminEditingProvider(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              <Sliders className="w-4.5 h-4.5 text-indigo-500" />
              <span>Edit Provider: {adminEditingProvider?.label}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Update global description, test credentials, and notes for this provider.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdminEditSubmit} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Description</label>
              <textarea
                value={adminDescription}
                onChange={(e) => setAdminDescription(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-indigo-500 rounded-lg text-sm font-sans transition-colors resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                Test Credentials (JSON)
              </label>
              <textarea
                value={adminTestCredentials}
                onChange={(e) => setAdminTestCredentials(e.target.value)}
                rows={4}
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-indigo-500 rounded-lg text-sm font-mono transition-colors resize-none"
                placeholder='{"card_number": "...", "pin": "..."}'
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Admin Notes / Warnings</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-indigo-500 rounded-lg text-sm font-sans transition-colors resize-none"
                placeholder="e.g. Standard Paystack sandbox cards apply."
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Global Support Enabled</span>
                <button
                  type="button"
                  onClick={() => setAdminIsSupported(!adminIsSupported)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                    adminIsSupported ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      adminIsSupported ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdminEditingProvider(null)}
                className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-805 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg font-semibold text-zinc-700 dark:text-zinc-300 text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold rounded-lg cursor-pointer disabled:opacity-50 transition-all text-xs"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Header and Add Button wrapped in Dialog */}
      <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-900 pb-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">Payment Providers</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 font-medium">Manage credentials for your payment providers.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (open) setAddStep(1)
        }}>
          <DialogTrigger asChild>
            <button className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer select-none">
              <Plus className="w-4.5 h-4.5" />
              <span>Add Provider</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                <Key className="w-4.5 h-4.5 text-[#2563eb] dark:text-[#3b82f6]" />
                <span>Add Payment Provider</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Your API keys are encrypted and stored securely.
              </DialogDescription>
            </DialogHeader>

            {/* Step indicator */}
            {(() => {
              const steps = ["Choose Provider", "Sandbox Keys", "Live Keys"]
              return (
                <div className="flex items-center gap-0 pt-1">
                  {steps.map((s, i) => {
                    const step = i + 1
                    const active = addStep === step
                    const done = addStep > step
                    return (
                      <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className="flex items-center gap-1.5">
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                            done ? "bg-[#2563EB] text-white" : active ? "bg-[#2563EB] text-white" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                          }`}>
                            {done ? (
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            ) : step}
                          </div>
                          <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600"}`}>{s}</span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`mx-2 h-px flex-1 transition-all ${done ? "bg-[#2563EB]" : "bg-zinc-200 dark:bg-zinc-800"}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* ── STEP 1: Choose provider + label ── */}
            {addStep === 1 && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Label (e.g. main-keys)</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. core-keys"
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#2563eb] rounded-lg text-sm font-sans transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Payment Provider</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {([
                      { name: "paystack", label: "Paystack", logo: "/provider-logos/Paystack/Paystack_idSL4BuSLF_0.svg", color: "#00C3F7" },
                      { name: "flutterwave", label: "Flutterwave", logo: null, color: "#F5A623" },
                      { name: "nomba", label: "Nomba", logo: "/provider-logos/Nomba/Nomba_idgTwBzT7P_6.svg", color: "#7C3AED" },
                      { name: "opay", label: "OPay", logo: "/provider-logos/OPay/OPay_id6sbCso4N_2.svg", color: "#10B981" },
                    ] as const).map((p) => {
                      const supported = supportedProviders.find(sp => sp.name === p.name)?.is_supported ?? false
                      const isSelected = providerName === p.name
                      return (
                        <button
                          key={p.name}
                          type="button"
                          disabled={!supported}
                          onClick={() => supported && setProviderName(p.name)}
                          className={[
                            "relative flex flex-col items-center justify-center gap-2 rounded-[12px] border-2 p-3 transition-all",
                            isSelected ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-[#1E3A5F]" : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
                            !supported ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                          ].join(" ")}
                        >
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#2563EB]">
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>
                          )}
                          <div className="flex h-8 w-8 items-center justify-center">
                            {p.logo ? (
                              <Image src={p.logo} alt={p.label} width={28} height={28} className="object-contain" />
                            ) : (
                              <span className="text-[9px] font-bold leading-tight text-center" style={{ color: p.color }}>{p.label}</span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{p.label}</span>
                          {!supported && <span className="text-[9px] text-zinc-400">Soon</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {(providerName === "nomba" || providerName === "opay") && (
                  <div className="space-y-1.5 animate-in fade-in duration-150">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                      {providerName === "nomba" ? "Nomba Account ID" : "OPay Merchant ID"}
                    </label>
                    <input
                      type="text"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      placeholder={providerName === "nomba" ? "e.g. acc-xxxxx-xxxx" : "e.g. 256612345678901"}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#2563eb] rounded-lg text-sm font-sans transition-colors"
                    />
                  </div>
                )}

                {/* Provider notes */}
                {(() => {
                  const info = supportedProviders.find(sp => sp.name === providerName)
                  if (!info?.notes) return null
                  return (
                    <details className="group border border-indigo-500/10 bg-indigo-500/5 rounded-xl overflow-hidden">
                      <summary className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer select-none">
                        <div className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="uppercase tracking-wider">Provider Notes</span>
                        </div>
                        <span className="text-[9px] uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded group-open:hidden">Show</span>
                        <span className="text-[9px] uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded hidden group-open:inline">Hide</span>
                      </summary>
                      <div className="px-3 pb-3 pt-1 text-[11px] text-zinc-650 dark:text-zinc-400 leading-relaxed font-medium border-t border-indigo-500/10">
                        {info.notes}
                      </div>
                    </details>
                  )
                })()}

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setDialogOpen(false)} className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg font-semibold text-zinc-700 dark:text-zinc-300 text-xs transition-all cursor-pointer">
                    Cancel
                  </button>
                  <button type="button" onClick={() => setAddStep(2)} className="px-4 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg text-xs transition-all cursor-pointer">
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Test / Sandbox keys ── */}
            {addStep === 2 && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/8 border border-amber-500/15 px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"/>
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Sandbox / Test Environment</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                      {providerName === "nomba" ? "Test Client Secret" : "Test Secret Key"}
                    </label>
                    <input
                      type="password"
                      value={testSecretKey}
                      onChange={(e) => setTestSecretKey(e.target.value)}
                      placeholder={providerName === "paystack" ? "sk_test_..." : providerName === "flutterwave" ? "FLWSECK_TEST-..." : providerName === "opay" ? "OPAYSEC..." : "client_secret_..."}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#2563eb] rounded-lg text-sm font-mono transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                      {providerName === "nomba" ? "Test Client ID" : providerName === "opay" ? "Test Public Key" : "Test Public Key"}
                    </label>
                    <input
                      type="text"
                      value={testPublicKey}
                      onChange={(e) => setTestPublicKey(e.target.value)}
                      placeholder={providerName === "paystack" ? "pk_test_..." : providerName === "flutterwave" ? "FLWPUBK_TEST-..." : providerName === "opay" ? "OPAYPUB..." : "client_id_..."}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#2563eb] rounded-lg text-sm font-mono transition-colors"
                    />
                  </div>
                </div>

                <details className="group border border-zinc-200 dark:border-zinc-900 rounded-lg overflow-hidden">
                  <summary className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                    <span>Webhook Secret (Optional)</span>
                    <Sliders className="w-3.5 h-3.5 text-zinc-400 group-open:rotate-180 transition-transform duration-200" />
                  </summary>
                  <div className="p-3 border-t border-zinc-200 dark:border-zinc-900 space-y-1.5">
                    <input
                      type="password"
                      value={testWebhookSecret}
                      onChange={(e) => setTestWebhookSecret(e.target.value)}
                      placeholder="e.g. whsec_..."
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#2563eb] rounded-lg text-xs font-mono transition-colors"
                    />
                    <p className="text-[10px] text-zinc-400 leading-relaxed">Defaults to Test Secret Key if left empty.</p>
                  </div>
                </details>

                {/* Sandbox test credentials copy */}
                {(() => {
                  const info = supportedProviders.find(sp => sp.name === providerName)
                  if (!info?.test_credentials) return null
                  try {
                    const parsed = JSON.parse(info.test_credentials)
                    return (
                      <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          <Info className="w-3.5 h-3.5" />
                          <span>Sandbox Test Credentials</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          {[
                            { key: "card_number", label: "Card", msg: "Card number copied!" },
                            { key: "pin", label: "PIN", msg: "PIN copied!" },
                            { key: "cvv", label: "CVV", msg: "CVV copied!" },
                            { key: "otp", label: "OTP", msg: "OTP copied!" },
                          ].filter(f => parsed[f.key]).map(f => (
                            <div key={f.key} className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 px-2 py-1 rounded-lg">
                              <span className="font-semibold text-zinc-500">{f.label}:</span>
                              <button type="button" onClick={() => { navigator.clipboard.writeText(parsed[f.key]); toast.success(f.msg) }} className="font-mono text-zinc-900 dark:text-zinc-200 hover:text-amber-500 flex items-center gap-1 transition-colors">
                                <span>{parsed[f.key]}</span>
                                <Copy className="w-3 h-3 text-zinc-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  } catch { return null }
                })()}

                <div className="flex justify-between gap-2 pt-1">
                  <button type="button" onClick={() => setAddStep(1)} className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg font-semibold text-zinc-700 dark:text-zinc-300 text-xs transition-all cursor-pointer">
                    ← Back
                  </button>
                  <button type="button" onClick={() => setAddStep(3)} className="px-4 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg text-xs transition-all cursor-pointer">
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Live / Production keys ── */}
            {addStep === 3 && (
              <form onSubmit={handleAddSubmit} className="space-y-3 pt-1 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15 px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Live / Production Environment</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                      {providerName === "nomba" ? "Live Client Secret" : "Live Secret Key"}
                    </label>
                    <input
                      type="password"
                      value={liveSecretKey}
                      onChange={(e) => setLiveSecretKey(e.target.value)}
                      placeholder={providerName === "paystack" ? "sk_live_..." : providerName === "flutterwave" ? "FLWSECK-..." : providerName === "opay" ? "OPAYSEC..." : "client_secret_..."}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#2563eb] rounded-lg text-sm font-mono transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                      {providerName === "nomba" ? "Live Client ID" : providerName === "opay" ? "Live Public Key" : "Live Public Key"}
                    </label>
                    <input
                      type="text"
                      value={livePublicKey}
                      onChange={(e) => setLivePublicKey(e.target.value)}
                      placeholder={providerName === "paystack" ? "pk_live_..." : providerName === "flutterwave" ? "FLWPUBK-..." : providerName === "opay" ? "OPAYPUB..." : "client_id_..."}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#2563eb] rounded-lg text-sm font-mono transition-colors"
                    />
                  </div>
                </div>

                <details className="group border border-zinc-200 dark:border-zinc-900 rounded-lg overflow-hidden">
                  <summary className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                    <span>Webhook Secret (Optional)</span>
                    <Sliders className="w-3.5 h-3.5 text-zinc-400 group-open:rotate-180 transition-transform duration-200" />
                  </summary>
                  <div className="p-3 border-t border-zinc-200 dark:border-zinc-900 space-y-1.5">
                    <input
                      type="password"
                      value={liveWebhookSecret}
                      onChange={(e) => setLiveWebhookSecret(e.target.value)}
                      placeholder="e.g. whsec_..."
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#2563eb] rounded-lg text-xs font-mono transition-colors"
                    />
                    <p className="text-[10px] text-zinc-400 leading-relaxed">Defaults to Live Secret Key if left empty.</p>
                  </div>
                </details>

                <div className="flex justify-between gap-2 pt-1">
                  <button type="button" onClick={() => setAddStep(2)} className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg font-semibold text-zinc-700 dark:text-zinc-300 text-xs transition-all cursor-pointer">
                    ← Back
                  </button>
                  <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg cursor-pointer disabled:opacity-50 transition-all text-xs">
                    {isPending ? "Saving..." : "Save Provider"}
                  </button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid registry */}
      {providers.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20">
          <HelpCircle className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <p className="text-sm font-medium">No payment credentials stored yet.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5 max-w-sm mx-auto">Add credentials above to connect your payment provider keys.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providers.map((p) => {
            const isTestRevealed = revealKeyId === p.id && revealType === "test"
            const isLiveRevealed = revealKeyId === p.id && revealType === "live"
            const globalProv = supportedProviders.find((sp) => sp.name === p.provider_name)

            return (
              <div
                key={p.id}
                className={`p-6 border bg-white/40 dark:bg-zinc-900/10 backdrop-blur relative rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 ${
                  p.is_active
                    ? "border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.02)]"
                    : "border-zinc-200 dark:border-zinc-900 border-dashed"
                }`}
              >
                <div>
                  {/* Status header */}
                  <div className="flex items-start justify-between mb-4 pb-3 border-b border-zinc-200/60 dark:border-zinc-900">
                    <div>
                      <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-base tracking-tight">{p.label}</h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] font-bold text-[#2563eb] dark:text-[#3b82f6] bg-[#2563eb]/10 px-2.5 py-0.5 rounded border border-[#2563eb]/20 uppercase tracking-wide">
                          {p.provider_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.is_active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-emerald-500" : "bg-zinc-400"}`} />
                        {p.is_active ? "Connected" : "Inactive"}
                      </span>
                      {/* Custom Toggle Switch */}
                      <button
                        onClick={() => handleToggle(p.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                          p.is_active ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-805"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            p.is_active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Keys Grid */}
                  <div className="space-y-4 pt-1 text-sm">
                    {/* Test Sandbox Credentials Section */}
                    <div className="p-3 border border-amber-500/10 bg-amber-500/5 rounded-xl space-y-3">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                        Test Sandbox Environment
                      </span>
                      {p.test_secret_key || p.secret_key ? (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400 dark:text-zinc-500 font-semibold text-[10px]">SECRET KEY</span>
                              <button
                                onClick={() => toggleRevealKey(p.id, "test")}
                                className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                              >
                                {isTestRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="px-2.5 py-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate">
                              {(() => {
                                const k = p.test_secret_key || p.secret_key
                                return isTestRevealed ? k : `${k.slice(0, 12)}•••••••••••••••••`
                              })()}
                            </div>
                          </div>
                          {(p.test_public_key || p.public_key) && (
                            <div className="space-y-1">
                              <span className="text-zinc-400 dark:text-zinc-500 font-semibold text-[10px] block">PUBLIC KEY</span>
                              <div className="px-2.5 py-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate">
                                {p.test_public_key || p.public_key}
                              </div>
                            </div>
                          )}
                          {p.test_webhook_secret && (
                            <div className="space-y-1">
                              <span className="text-zinc-400 dark:text-zinc-500 font-semibold text-[10px] block">WEBHOOK SECRET</span>
                              <div className="px-2.5 py-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate">
                                {isTestRevealed ? p.test_webhook_secret : `${p.test_webhook_secret.slice(0, 12)}•••••••••••••••••`}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400">Not configured</p>
                      )}
                    </div>

                    {/* Live Production Credentials Section */}
                    <div className="p-3 border border-emerald-500/10 bg-emerald-500/5 rounded-xl space-y-3">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                        Live Production Environment
                      </span>
                      {p.live_secret_key ? (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400 dark:text-zinc-500 font-semibold text-[10px]">SECRET KEY</span>
                              <button
                                onClick={() => toggleRevealKey(p.id, "live")}
                                className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                              >
                                {isLiveRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="px-2.5 py-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate">
                              {isLiveRevealed ? p.live_secret_key : `${p.live_secret_key.slice(0, 12)}•••••••••••••••••`}
                            </div>
                          </div>
                          {p.live_public_key && (
                            <div className="space-y-1">
                              <span className="text-zinc-400 dark:text-zinc-500 font-semibold text-[10px] block">PUBLIC KEY</span>
                              <div className="px-2.5 py-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate">
                                {p.live_public_key}
                              </div>
                            </div>
                          )}
                          {p.live_webhook_secret && (
                            <div className="space-y-1">
                              <span className="text-zinc-400 dark:text-zinc-500 font-semibold text-[10px] block">WEBHOOK SECRET</span>
                              <div className="px-2.5 py-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate">
                                {isLiveRevealed ? p.live_webhook_secret : `${p.live_webhook_secret.slice(0, 12)}•••••••••••••••••`}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400">Not configured</p>
                      )}
                    </div>

                  {/* Admin Notes rendering in the card */}
                  {globalProv?.notes && (
                    <div className="mt-4 p-3 bg-zinc-100/50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-900/50 rounded-xl flex gap-2">
                      <HelpCircle className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Admin Notes</span>
                        <p className="text-[11px] text-zinc-650 dark:text-zinc-400 mt-0.5 leading-normal">{globalProv.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Sandbox credentials card copy-UI inside the card */}
                  {globalProv?.test_credentials && (p.test_secret_key || p.secret_key) && (
                    <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        <Info className="w-3 h-3" />
                        <span>Interactive Sandbox Credentials</span>
                      </div>
                      {(() => {
                        try {
                          const parsed = JSON.parse(globalProv.test_credentials)
                          return (
                            <div className="text-[10px] text-zinc-600 dark:text-zinc-400 space-y-1">
                              {parsed.card_number && (
                                <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-zinc-200/20 dark:hover:bg-zinc-800/30">
                                  <span>Card:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(parsed.card_number)
                                      toast.success("Card number copied!")
                                    }}
                                    className="font-mono hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1 transition-colors"
                                  >
                                    <span>{parsed.card_number}</span>
                                    <Copy className="w-2.5 h-2.5 text-zinc-400" />
                                  </button>
                                </div>
                              )}
                              {parsed.pin && (
                                <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-zinc-200/20 dark:hover:bg-zinc-800/30">
                                  <span>PIN:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(parsed.pin)
                                      toast.success("PIN copied!")
                                    }}
                                    className="font-mono hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1 transition-colors"
                                  >
                                    <span>{parsed.pin}</span>
                                    <Copy className="w-2.5 h-2.5 text-zinc-400" />
                                  </button>
                                </div>
                              )}
                              {parsed.otp && (
                                <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-zinc-200/20 dark:hover:bg-zinc-800/30">
                                  <span>OTP:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(parsed.otp)
                                      toast.success("OTP copied!")
                                    }}
                                    className="font-mono hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1 transition-colors"
                                  >
                                    <span>{parsed.otp}</span>
                                    <Copy className="w-2.5 h-2.5 text-zinc-400" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        } catch(e) { return null }
                      })()}
                    </div>
                  )}
                </div>
              </div>

                {/* Footer details & delete button */}
                <div className="flex items-center justify-between mt-6 pt-3 border-t border-zinc-200/60 dark:border-zinc-900">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span>Stored securely and encrypted</span>
                  </span>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-900 hover:border-red-500/20 hover:bg-red-500/5 dark:hover:bg-red-950/20 text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-all cursor-pointer rounded-lg bg-white dark:bg-transparent"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
