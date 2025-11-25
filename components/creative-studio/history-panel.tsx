"use client"

import { useEffect, useState } from "react"
import type { Job } from "@/lib/types"

interface HistoryPanelProps {
  deviceId: string
  onSelect: (job: Job) => void
  refreshKey: number
}

export function HistoryPanel({ deviceId, onSelect, refreshKey }: HistoryPanelProps) {
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
            <button
              key={job.jobId}
              onClick={() => onSelect(job)}
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <p className="text-xs text-white line-clamp-2">{job.originalPrompt}</p>
              </div>
              {job.status === "failed" && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs bg-red-500/80 text-white">
                  Failed
                </div>
              )}
            </button>
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
