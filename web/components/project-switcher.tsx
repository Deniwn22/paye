"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Plus, Folder, Check, Trash2, Loader2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { switchProjectAction, createProjectAction, deleteProjectAction } from "@/app/actions"
import { toast } from "sonner"

interface Project {
  id: string
  name: string
  api_key: string
  public_id: string
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
  const activeProject = projects.find((p) => p.id === activeProjectID) || projects[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation() // prevent switching when clicking delete
    if (!confirm(`Are you sure you want to delete project "${name}"? This will soft-delete the project and its configurations.`)) {
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
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-[#222] bg-zinc-50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 text-sm font-semibold transition-all cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 truncate">
          <Folder className="w-4 h-4 text-sky-500 flex-shrink-0" />
          <span className="truncate">{activeProject?.name || "Select Project"}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 p-1 bg-white dark:bg-[#111] border border-zinc-200 dark:border-[#222] rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none">
            Projects
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSwitch(project.id)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all cursor-pointer group ${
                  project.id === activeProjectID
                    ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className={`w-3.5 h-3.5 flex-shrink-0 ${project.id === activeProjectID ? "text-sky-500" : "text-zinc-400 dark:text-zinc-500"}`} />
                  <span className="truncate">{project.name}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  {project.id === activeProjectID && (
                    <Check className="w-3.5 h-3.5 text-sky-500" />
                  )}
                  {/* Delete button (hidden for Default Project or if only 1 project left) */}
                  {projects.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(e, project.id, project.name)}
                      disabled={deletingId !== null}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-500 transition-all cursor-pointer"
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-zinc-200 dark:bg-[#222] my-1" />

          {/* Create Button */}
          <button
            onClick={() => {
              setIsOpen(false)
              setShowCreateDialog(true)
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200 font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-zinc-400" />
            <span>Create New Project</span>
          </button>
        </div>
      )}

      {/* Create Project Modal Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-[#222] rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-200 dark:border-[#222] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-500" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white uppercase tracking-wide">
                New Project
              </h3>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My E-commerce Shop"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-[#222] focus:border-sky-500 dark:focus:border-sky-500 text-zinc-800 dark:text-zinc-200 text-sm rounded-lg outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-[#222] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDialog(false)
                    setNewProjectName("")
                  }}
                  className="px-4 py-2 border border-zinc-200 dark:border-[#222] hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newProjectName.trim()}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
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
