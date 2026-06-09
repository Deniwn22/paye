"use client"

import { useState, useTransition } from "react"
import { addProviderAction, deleteProviderAction, toggleProviderAction } from "@/app/actions"
import { Plus, Trash2, Key, HelpCircle, ShieldCheck, Check, AlertCircle, Eye, EyeOff, Radio } from "lucide-react"
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
  is_active: boolean
}

export default function ProvidersManager({ initialProviders = [] }: { initialProviders?: ProviderConfig[] }) {
  const [providers, setProviders] = useState<ProviderConfig[]>(initialProviders || [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Form states
  const [label, setLabel] = useState("")
  const [providerName, setProviderName] = useState("paystack")
  const [testSecretKey, setTestSecretKey] = useState("")
  const [testPublicKey, setTestPublicKey] = useState("")
  const [liveSecretKey, setLiveSecretKey] = useState("")
  const [livePublicKey, setLivePublicKey] = useState("")

  const [formTab, setFormTab] = useState<"test" | "live">("test")
  const [revealKeyId, setRevealKeyId] = useState<string | null>(null)
  const [revealType, setRevealType] = useState<"test" | "live">("test")

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

    if (!validateKeys()) return

    const formData = new FormData()
    formData.append("label", label)
    formData.append("providerName", providerName)
    formData.append("testSecretKey", testSecretKey)
    formData.append("testPublicKey", testPublicKey)
    formData.append("liveSecretKey", liveSecretKey)
    formData.append("livePublicKey", livePublicKey)

    startTransition(async () => {
      const res = await addProviderAction(null, formData)
      if (!res.success) {
        toast.error(res.error || "Failed to add provider")
      } else {
        toast.success(res.message || "Provider registered successfully")
        setLabel("")
        setTestSecretKey("")
        setTestPublicKey("")
        setLiveSecretKey("")
        setLivePublicKey("")
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
      {/* Header and Add Button wrapped in Dialog */}
      <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-900 pb-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">Payment Providers</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 font-medium">Manage credentials for your payment providers.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="px-4 py-2.5 rounded-lg border border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:border-sky-500/40 text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Add Provider</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                <Key className="w-4.5 h-4.5 text-sky-500" />
                <span>Add Payment Provider</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Your API keys are encrypted and stored securely. We verify key prefixes to match sandbox and production gates.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Label (e.g. main-keys)</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. core-keys"
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500 rounded-lg text-sm font-sans transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Payment Provider</label>
                  <select
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-500 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                  >
                    <option value="paystack">Paystack</option>
                    <option value="flutterwave">Flutterwave</option>
                  </select>
                </div>
              </div>

              {/* Form Environment Tabs */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 mt-2">
                <button
                  type="button"
                  onClick={() => setFormTab("test")}
                  className={`flex-1 py-1.5 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    formTab === "test"
                      ? "border-amber-500 text-amber-500"
                      : "border-transparent text-zinc-500"
                  }`}
                >
                  Test Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab("live")}
                  className={`flex-1 py-1.5 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    formTab === "live"
                      ? "border-emerald-500 text-emerald-500"
                      : "border-transparent text-zinc-500"
                  }`}
                >
                  Live Production
                </button>
              </div>

              {formTab === "test" ? (
                <div className="space-y-4 pt-2 animate-in fade-in duration-150">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Test Secret Key</label>
                    <input
                      type="password"
                      value={testSecretKey}
                      onChange={(e) => setTestSecretKey(e.target.value)}
                      placeholder={providerName === "paystack" ? "sk_test_..." : "FLWSECK_TEST-..."}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500 rounded-lg text-sm font-mono transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Test Public Key (Optional)</label>
                    <input
                      type="text"
                      value={testPublicKey}
                      onChange={(e) => setTestPublicKey(e.target.value)}
                      placeholder={providerName === "paystack" ? "pk_test_..." : "FLWPUBK_TEST-..."}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500 rounded-lg text-sm font-mono transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2 animate-in fade-in duration-150">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Live Secret Key</label>
                    <input
                      type="password"
                      value={liveSecretKey}
                      onChange={(e) => setLiveSecretKey(e.target.value)}
                      placeholder={providerName === "paystack" ? "sk_live_..." : "FLWSECK-..."}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500 rounded-lg text-sm font-mono transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Live Public Key (Optional)</label>
                    <input
                      type="text"
                      value={livePublicKey}
                      onChange={(e) => setLivePublicKey(e.target.value)}
                      placeholder={providerName === "paystack" ? "pk_live_..." : "FLWPUBK-..."}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500 rounded-lg text-sm font-mono transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg font-bold text-zinc-700 dark:text-zinc-300 text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-extrabold rounded-lg shadow-md shadow-sky-500/10 hover:shadow-sky-500/20 cursor-pointer disabled:opacity-50 transition-all text-sm"
                >
                  {isPending ? "Saving..." : "Save Provider"}
                </button>
              </div>
            </form>
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
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20 uppercase tracking-wide">
                          {p.provider_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.is_active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-emerald-500" : "bg-zinc-400"}`} />
                        {p.is_active ? "Connected" : "Inactive"}
                      </span>
                      <button
                        onClick={() => handleToggle(p.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          p.is_active
                            ? "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20"
                            : "border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900/40"
                        }`}
                      >
                        {p.is_active ? "Disable" : "Enable"}
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
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400">Not configured</p>
                      )}
                    </div>
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
