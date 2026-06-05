"use client"

import { useState, useTransition } from "react"
import { addProviderAction, deleteProviderAction, toggleProviderAction } from "@/app/actions"
import { Plus, Trash2, Key, HelpCircle, ShieldCheck, Check, AlertCircle, Eye, EyeOff } from "lucide-react"
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
  is_active: boolean
}

export default function ProvidersManager({ initialProviders = [] }: { initialProviders?: ProviderConfig[] }) {
  const [providers, setProviders] = useState<ProviderConfig[]>(initialProviders || [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Form states
  const [label, setLabel] = useState("")
  const [providerName, setProviderName] = useState("paystack")
  const [secretKey, setSecretKey] = useState("")
  const [publicKey, setPublicKey] = useState("")

  const [revealKeyId, setRevealKeyId] = useState<string | null>(null)

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!label || !secretKey) {
      toast.error("Name and secret key are required")
      return
    }

    const formData = new FormData()
    formData.append("label", label)
    formData.append("providerName", providerName)
    formData.append("secretKey", secretKey)
    formData.append("publicKey", publicKey)

    startTransition(async () => {
      const res = await addProviderAction(null, formData)
      if (!res.success) {
        toast.error(res.error || "Failed to add provider")
      } else {
        toast.success(res.message || "Provider registered successfully")
        setLabel("")
        setSecretKey("")
        setPublicKey("")
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

  const toggleRevealKey = (id: string) => {
    setRevealKeyId(revealKeyId === id ? null : id)
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
                Your API keys are encrypted and stored securely. We never expose them in plain text — not in responses, logs, or anywhere on this dashboard.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Name (e.g. paystack-live)</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. paystack-live"
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

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Secret Key</label>
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="e.g. sk_live_xxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500 rounded-lg text-sm font-mono transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Public Key (Optional)</label>
                <input
                  type="text"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder="e.g. pk_live_xxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500 rounded-lg text-sm font-mono transition-colors"
                />
              </div>

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
            const isRevealed = revealKeyId === p.id
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

                  {/* Keys Block */}
                  <div className="space-y-3.5 pt-1 text-sm">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 dark:text-zinc-500 uppercase font-bold text-[10px] tracking-wider block">Secret Key</span>
                        <button
                          onClick={() => toggleRevealKey(p.id)}
                          className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer p-0.5"
                          title={isRevealed ? "Hide key" : "Reveal key"}
                        >
                          {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="px-3.5 py-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate select-all flex items-center justify-between">
                        <span>{isRevealed ? p.secret_key : `${p.secret_key.slice(0, 12)}••••••••••••••••••••••••••••`}</span>
                      </div>
                    </div>

                    {p.public_key && (
                      <div className="space-y-1.5">
                        <span className="text-zinc-400 dark:text-zinc-500 uppercase font-bold text-[10px] tracking-wider block">Public Key</span>
                        <div className="px-3.5 py-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate select-all">
                          {p.public_key}
                        </div>
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
