"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { Job } from "@/lib/types"

interface HistoryPanelProps {
  deviceId: string
  onSelect: (job: Job) => void
  onEdit: (job: Job) => void
  refreshKey: number
}

export function HistoryPanel({ deviceId, onSelect, onEdit, refreshKey }: HistoryPanelProps) {
  const [history, setHistory] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/history?deviceId=${deviceId}`)
        const data = await res.json()
        setHistory(data.jobs || [])
      } catch (error) {
        console.error("Failed to fetch history:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [deviceId, refreshKey])

  const handleDownload = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation()
    if (!job.previewUrl) return
    
    try {
      const response = await fetch(job.previewUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `creative-studio-${job.jobId.slice(0, 8)}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Image downloaded!")
    } catch (error) {
      toast.error("Failed to download image")
    }
  }

  const handleEdit = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation()
    onEdit(job)
    toast.info("Image loaded for editing")
  }

  const handleView = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation()
    onSelect(job)
  }

  return (
    <div className="w-72 flex-shrink-0 glass-panel p-5 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium">History</h2>
        <span className="text-xs text-muted-foreground">{history.length} images</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
              <ClockIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No generations yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Your creations will appear here</p>
          </div>
        ) : (
          history.map((job) => (
            <div
              key={job.jobId}
              className="w-full group relative rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition-all"
            >
              {job.previewUrl ? (
                <img
                  src={job.previewUrl || "/placeholder.svg"}
                  alt={job.originalPrompt || "Generated image"}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-white/5 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              
              {/* Hover overlay with buttons */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleView(e, job)}
                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                    title="View in preview"
                  >
                    <EyeIcon className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={(e) => handleEdit(e, job)}
                    className="p-2 rounded-lg bg-cyan-500/80 hover:bg-cyan-500 transition-colors"
                    title="Edit this image"
                  >
                    <EditIcon className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={(e) => handleDownload(e, job)}
                    className="p-2 rounded-lg bg-violet-500/80 hover:bg-violet-500 transition-colors"
                    title="Download image"
                  >
                    <DownloadIcon className="w-4 h-4 text-white" />
                  </button>
                </div>
                
                {/* Prompt preview */}
                <p className="text-xs text-white/80 line-clamp-2 px-3 text-center mt-1">
                  {job.originalPrompt}
                </p>
              </div>
              
              {job.status === "failed" && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs bg-red-500/80 text-white">
                  Failed
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}
