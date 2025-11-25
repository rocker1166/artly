"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import type { Job } from "@/lib/types"
import type { AdjustmentValues } from "./config-panel"
import { DEFAULT_ADJUSTMENTS } from "./config-panel"

interface PreviewCanvasProps {
  job: Job | null
  isGenerating: boolean
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onRetry?: () => void
  adjustments: AdjustmentValues
  appliedImageUrl: string | null
}

const PROGRESS_MESSAGES = [
  "Analyzing your prompt...",
  "Enhancing details...",
  "Applying style transformations...",
  "Generating pixels...",
  "Adding finishing touches...",
  "Almost there...",
]

type AdjustmentKey = keyof typeof DEFAULT_ADJUSTMENTS

export function PreviewCanvas({
  job,
  isGenerating,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onRetry,
  adjustments,
  appliedImageUrl,
}: PreviewCanvasProps) {
  const [progressMessage, setProgressMessage] = useState(PROGRESS_MESSAGES[0])
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey && canRedo) {
          e.preventDefault()
          onRedo?.()
        } else if (!e.shiftKey && canUndo) {
          e.preventDefault()
          onUndo?.()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [canUndo, canRedo, onUndo, onRedo])

  useEffect(() => {
    if (!isGenerating) {
      setMessageIndex(0)
      return
    }
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [isGenerating])

  useEffect(() => {
    setProgressMessage(job?.progressMessage || PROGRESS_MESSAGES[messageIndex])
  }, [messageIndex, job?.progressMessage])

  const currentImageSrc = appliedImageUrl || job?.finalUrl || job?.previewUrl || ""
  const hasAdjustmentsChanges = useMemo(
    () => Object.keys(DEFAULT_ADJUSTMENTS).some((key) => adjustments[key as AdjustmentKey] !== DEFAULT_ADJUSTMENTS[key as AdjustmentKey]),
    [adjustments],
  )
  const cssFilter = useMemo(() => buildCssFilter(adjustments), [adjustments])

  return (
    <div className="flex-1 glass-panel p-5 flex flex-col">
      {/* Header with status and undo/redo */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium">Preview</h2>
        <div className="flex items-center gap-2">
          {/* Undo/Redo buttons */}
          <div className="flex gap-1 mr-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Undo (Ctrl+Z)"
            >
              <UndoIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Redo (Ctrl+Shift+Z)"
            >
              <RedoIcon className="w-4 h-4" />
            </button>
          </div>
          {job && <StatusBadge status={job.status} />}
        </div>
      </div>

      {/* Main preview area */}
      <div className="flex-1 flex items-center justify-center rounded-xl bg-black/20 border border-white/5 overflow-hidden relative">
        {/* Generating state with animated message */}
        {isGenerating && !job?.previewUrl && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-b-violet-500 animate-spin"
                  style={{ animationDirection: "reverse" }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground animate-pulse">{progressMessage}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">This may take a moment</p>
            </div>
            {/* Low-res preview skeleton */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 animate-pulse" />
          </div>
        )}

        {/* Preview image */}
        {currentImageSrc && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={currentImageSrc}
              alt="Generated preview"
              className="max-w-full max-h-full object-contain"
              style={hasAdjustmentsChanges ? { filter: cssFilter } : undefined}
            />
            {/* HD badge if full resolution */}
            {job?.settings?.imageSize === "4K" && job?.status === "done" && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-amber-500/80 text-white text-xs font-medium">
                4K HD
              </div>
            )}
            {/* Processing overlay for quick preview */}
            {isGenerating && job.previewUrl && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center">
                  <LoaderIcon className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
                  <p className="text-sm text-white">Upscaling to HD...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!isGenerating && !job && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Enter a prompt to generate an image</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Or upload an image to edit</p>
          </div>
        )}

        {/* Failed state with retry */}
        {job?.status === "failed" && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <XIcon className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-400 mb-2">Generation failed</p>
            <p className="text-xs text-muted-foreground mb-4">{job.error || "Please try again"}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
              >
                <RefreshIcon className="w-4 h-4 inline mr-2" />
                Retry with lower quality
              </button>
            )}
          </div>
        )}
      </div>

      {/* Enhanced prompt display */}
      {job?.enhancedPrompt && (
        <div className="mt-4 p-3 rounded-lg bg-black/20 border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Enhanced Prompt</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(job.enhancedPrompt || "")
                toast.success("Prompt copied to clipboard!")
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-sm text-foreground/80 line-clamp-3">{job.enhancedPrompt}</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status?: Job["status"] }) {
  const styles = {
    queued: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    processing: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    done: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
  }
  const styleKey = status && styles[status] ? status : "queued"
  const label =
    status && status.length > 0 ? status.charAt(0).toUpperCase() + status.slice(1) : "Queued"

  return (
    <span className={`px-2 py-1 text-xs rounded-full border ${styles[styleKey]}`}>
      {styleKey === "processing" && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      )}
      {label}
    </span>
  )
}

function buildCssFilter(adj: typeof DEFAULT_ADJUSTMENTS) {
  const brightness = adj.brightness / 100
  const clarityBoost = adj.clarity > 50 ? adj.clarity / 50 : 1
  const contrast = (adj.contrast / 100) * clarityBoost
  const saturation = adj.saturation / 100
  const blurValue = adj.clarity < 50 ? (50 - adj.clarity) / 20 : 0

  const filters = [`brightness(${brightness})`, `contrast(${contrast})`, `saturate(${saturation})`]

  if (blurValue > 0) {
    filters.push(`blur(${blurValue}px)`)
  }

  return filters.join(" ")
}

function UndoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  )
}

function RedoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )
}
