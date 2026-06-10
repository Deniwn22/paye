"use client"

import { useState, useRef, useEffect } from "react"
import {
  ChevronDown,
  Plus,
  Folder,
  Check,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  switchProjectAction,
  createProjectAction,
  deleteProjectAction,
} from "@/app/actions"
import { toast } from "sonner"

export interface Project {
  id: string
  name: string
  api_key: string
  public_id: string
  test_api_key: string // add
  test_public_id: string // add
}

export default function ProjectSwitcher({
  projects,
  activeProjectID,
}: {
  projects: Project[]
  activeProjectID: string
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Find active project
  const activeProject =
    projects.find((p) => p.id === activeProjectID) || projects[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSwitch = async (id: string) => {
    if (id === activeProjectID) return
    const res = await switchProjectAction(id)
    if (res.success) {
      setIsOpen(false)
      toast.success("Switched project workspace")
      router.refresh()
    } else {
      toast.error("Failed to switch project")
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setIsCreating(true)
    const res = await createProjectAction(newProjectName.trim())
    setIsCreating(false)

    if (res.success) {
      setShowCreateDialog(false)
      setNewProjectName("")
      toast.success("Project created successfully")
      router.refresh()
    } else {
      toast.error(res.error || "Failed to create project")
    }
  }

  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
    name: string
  ) => {
    e.stopPropagation() // prevent switching when clicking delete
    if (
      !confirm(
        `Are you sure you want to delete project "${name}"? This will soft-delete the project and its configurations.`
      )
    ) {
      return
    }

    setDeletingId(id)
    const res = await deleteProjectAction(id)
    setDeletingId(null)

    if (res.success) {
      toast.success("Project deleted successfully")
      router.refresh()
    } else {
      toast.error(res.error || "Failed to delete project")
    }
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-zinc-700 transition-all select-none hover:bg-zinc-100 dark:border-[#222] dark:bg-zinc-900/30 dark:text-zinc-300 dark:hover:bg-zinc-900/60"
      >
        <div className="flex items-center gap-2 truncate">
          <Folder className="h-4 w-4 flex-shrink-0 text-[#2563eb]" />
          <span className="truncate">
            {activeProject?.name || "Select Project"}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 left-0 z-50 mt-1.5 animate-in rounded-lg border border-zinc-200 bg-white p-1 shadow-lg duration-200 fade-in slide-in-from-top-1 dark:border-[#222] dark:bg-[#111]">
          <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase select-none dark:text-zinc-500">
            Projects
          </div>

          <div className="max-h-60 space-y-0.5 overflow-y-auto">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSwitch(project.id)}
                className={`group flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-all ${
                  project.id === activeProjectID
                    ? "bg-[#eff6ff] font-bold text-[#2563eb] dark:bg-[#1e3a5f]/50 dark:text-[#3b82f6]"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder
                    className={`h-3.5 w-3.5 flex-shrink-0 ${project.id === activeProjectID ? "text-[#2563eb] dark:text-[#3b82f6]" : "text-zinc-400 dark:text-zinc-500"}`}
                  />
                  <span className="truncate">{project.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  {project.id === activeProjectID && (
                    <Check className="h-3.5 w-3.5 text-[#2563eb] dark:text-[#3b82f6]" />
                  )}
                  {/* Delete button (hidden for Default Project or if only 1 project left) */}
                  {projects.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(e, project.id, project.name)}
                      disabled={deletingId !== null}
                      className="cursor-pointer rounded p-1 text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500"
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="my-1 h-px bg-zinc-200 dark:bg-[#222]" />

          {/* Create Button */}
          <button
            onClick={() => {
              setIsOpen(false)
              setShowCreateDialog(true)
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
          >
            <Plus className="h-4 w-4 text-zinc-400" />
            <span>Create New Project</span>
          </button>
        </div>
      )}

      {/* Create Project Modal Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/50 p-4 backdrop-blur-sm duration-150 fade-in">
          <div className="w-full max-w-sm rounded-lg border-[0.5px] border-border bg-card shadow-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 border-b-[0.5px] border-border p-5">
              <Folder className="h-4 w-4 text-[#2563eb]" />
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Create New Project
              </h3>
            </div>

            <form onSubmit={handleCreate}>
              <div className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My E-commerce Shop"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full rounded-lg border-[0.5px] border-border bg-secondary px-3 py-2 text-xs text-foreground placeholder-zinc-400 dark:placeholder-zinc-650 transition-colors focus:border-[#2563eb] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-border p-4 bg-zinc-50/50 dark:bg-zinc-950/20">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDialog(false)
                    setNewProjectName("")
                  }}
                  className="cursor-pointer rounded-lg border-[0.5px] border-border px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-350 transition-colors hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newProjectName.trim()}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] px-3.5 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
