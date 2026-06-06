"use client"

import { useState, useTransition } from "react"
import { addWebhookAction, deleteWebhookAction } from "@/app/actions"
import { Plus, Link2, Copy, Check, Trash2, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react"
import { BACKEND_URL } from "@/lib/config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export interface WebhookConfig {
  id: string
  provider_name: string
  target_url: string
  paye_webhook_slug: string
}

export default function WebhooksManager({ initialConfigs = [] }: { initialConfigs?: WebhookConfig[] }) {
  const [configs, setConfigs] = useState<WebhookConfig[]>(initialConfigs || [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Form states
  const [providerName, setProviderName] = useState("paystack")
  const [targetUrl, setTargetUrl] = useState("")
  const [slug, setSlug] = useState("")

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  const handleCopyUrl = (slugValue: string) => {
    const fullUrl = `${BACKEND_URL}/webhooks/receive/${slugValue}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedSlug(slugValue)
    toast.success("Webhook URL copied to clipboard")
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!targetUrl) {
      toast.error("Target website link is required")
      return
    }

    const formData = new FormData()
    formData.append("providerName", providerName)
    formData.append("targetUrl", targetUrl)
    formData.append("slug", slug)

    startTransition(async () => {
      const res = await addWebhookAction(null, formData)
      if (!res.success) {
        toast.error(res.error || "Failed to configure webhook")
      } else {
        toast.success(res.message || "Webhook route configured successfully")
        setTargetUrl("")
        setSlug("")
        setDialogOpen(false)
        window.location.reload()
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook routing?")) return

    const res = await deleteWebhookAction(id)
    if (!res.success) {
      toast.error(res.error || "Failed to delete webhook configuration")
    } else {
      setConfigs(configs.filter((c) => c.id !== id))
      toast.success("Webhook route deleted successfully")
    }
  }

  return (
    <div className="space-y-6 text-sm font-sans select-text">
      {/* Header and Add Button wrapped in Dialog */}
      <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-900 pb-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Webhook Routes</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 font-medium">Route payment notifications from gateways to your website.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="px-4 py-2.5 rounded-lg border border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:border-sky-500/40 text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Add Webhook Route</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                <Link2 className="w-4.5 h-4.5 text-sky-500" />
                <span>Add Webhook Route</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Configure where you want Paye to send your payment notifications. We verify the payment signatures and relay them safely to your server.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-3">
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Custom URL name (Optional)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. core-callback-1"
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-sky-500 rounded-lg text-sm font-sans transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Where to send notifications (Your website or server endpoint)</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="e.g. https://my-backend-server.com/api/payment-webhook"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-sky-500 rounded-lg text-sm font-mono transition-colors"
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
                  {isPending ? "Saving..." : "Save Webhook Route"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid list routes */}
      {configs.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20">
          <Link2 className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <p className="text-sm font-medium">No webhook routes established.</p>
          <p className="text-xs text-zinc-400/80 mt-1.5 max-w-sm mx-auto">Create a route above to securely forward provider payment notifications to your website.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {configs.map((c) => {
            const proxyUrl = `${BACKEND_URL}/webhooks/receive/${c.paye_webhook_slug}`
            const isCopied = copiedSlug === c.paye_webhook_slug

            return (
              <div
                key={c.id}
                className="p-6 border border-zinc-200 dark:border-zinc-900 bg-white/40 dark:bg-zinc-900/10 backdrop-blur rounded-xl shadow-sm hover:shadow-md hover:border-sky-500/20 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
                      {c.provider_name}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold font-mono">ID: {c.id.slice(0, 8)}...</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Source Endpoint Block */}
                    <div className="space-y-1.5">
                      <span className="text-zinc-400 dark:text-zinc-500 uppercase font-bold text-[10px] tracking-wider block">
                        Gateway Webhook URL (Copy and paste this into your Paystack or Flutterwave dashboard)
                      </span>
                      <div className="flex items-center gap-2.5 w-full max-w-3xl">
                        <div className="flex-1 px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 font-mono text-xs text-sky-600 dark:text-sky-400 truncate select-all rounded-lg">
                          {proxyUrl}
                        </div>
                        <button
                          onClick={() => handleCopyUrl(c.paye_webhook_slug)}
                          className={`px-4 py-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            isCopied
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 hover:border-sky-500 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Arrow redirect helper */}
                    <div className="flex items-center gap-2 pl-3 text-zinc-400 dark:text-zinc-500">
                      <ArrowRight className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold">Relays safely to:</span>
                    </div>

                    {/* Target Endpoint Block */}
                    <div className="space-y-1.5">
                      <span className="text-zinc-400 dark:text-zinc-500 uppercase font-bold text-[10px] tracking-wider block">
                        Where to send notifications (Your website or server endpoint)
                      </span>
                      <div className="px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-900 font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate select-all rounded-lg max-w-3xl">
                        {c.target_url}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col justify-end items-end gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-900 hover:border-red-500/20 hover:bg-red-500/5 dark:hover:bg-red-950/20 text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-all cursor-pointer text-xs rounded-lg bg-white dark:bg-transparent"
                    title="Delete route"
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
