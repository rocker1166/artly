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
    <div className="flex-1 glass-panel p-6 flex flex-col noise-overlay">
      {/* Header with status and undo/redo */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold tracking-wide text-foreground/90 uppercase">Preview</h2>
        <div className="flex items-center gap-3">
          {/* Undo/Redo buttons */}
          <div className="flex gap-1 p-1 rounded-lg bg-white/3 border border-white/8">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Undo (Ctrl+Z)"
            >
              <UndoIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Redo (Ctrl+Shift+Z)"
            >
              <RedoIcon className="w-4 h-4" />
            </button>
          </div>
          {job && <StatusBadge status={job.status} />}
        </div>
      </div>

      {/* Main preview area */}
      <div className="flex-1 flex items-center justify-center rounded-2xl bg-black/30 border border-white/5 overflow-hidden relative backdrop-blur-sm">
        {/* Checkered background for transparency */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(45deg, #1a1a2e 25%, transparent 25%), 
                              linear-gradient(-45deg, #1a1a2e 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #1a1a2e 75%), 
                              linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }}
        />
        
        {/* Generating state with animated message */}
        {isGenerating && !job?.previewUrl && (
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[oklch(0.65_0.22_290)] to-[oklch(0.72_0.18_195)] blur-xl opacity-30 animate-pulse" />
              {/* Outer ring */}
              <div className="w-20 h-20 rounded-full border-2 border-[oklch(0.72_0.18_195/0.3)] border-t-[oklch(0.72_0.18_195)] animate-spin" />
              {/* Inner ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-10 h-10 rounded-full border-2 border-[oklch(0.65_0.22_290/0.3)] border-b-[oklch(0.65_0.22_290)] animate-spin"
                  style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-foreground/80">{progressMessage}</p>
              <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
            </div>
          </div>
        )}

        {/* Preview image */}
        {currentImageSrc && (
          <div className={`relative z-10 w-full h-full flex items-center justify-center p-4 ${isGenerating ? 'blur-sm opacity-50' : ''} transition-all duration-300`}>
            <img
              src={currentImageSrc}
              alt="Generated preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={hasAdjustmentsChanges ? { filter: cssFilter } : undefined}
            />
            {/* HD badge if full resolution */}
            {job?.settings?.imageSize === "4K" && job?.status === "done" && (
              <div className="absolute top-5 right-5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[oklch(0.75_0.18_85)] to-[oklch(0.7_0.2_45)] text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/80" />
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
        <div className="mt-5 p-4 rounded-xl bg-black/20 border border-white/8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.18_195)]" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Enhanced Prompt</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(job.enhancedPrompt || "")
                toast.success("Prompt copied to clipboard!")
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[oklch(0.8_0.15_195)] hover:bg-[oklch(0.72_0.18_195/0.15)] transition-colors"
            >
              <CopyIcon className="w-3.5 h-3.5" />
              Copy
            </button>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">{job.enhancedPrompt}</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status?: Job["status"] }) {
  const styles = {
    queued: "bg-[oklch(0.75_0.18_85/0.15)] text-[oklch(0.8_0.16_85)] border-[oklch(0.75_0.18_85/0.3)]",
    processing: "bg-[oklch(0.72_0.18_195/0.15)] text-[oklch(0.8_0.15_195)] border-[oklch(0.72_0.18_195/0.3)]",
    done: "bg-[oklch(0.68_0.2_150/0.15)] text-[oklch(0.75_0.18_150)] border-[oklch(0.68_0.2_150/0.3)]",
    failed: "bg-[oklch(0.55_0.2_20/0.15)] text-[oklch(0.7_0.18_20)] border-[oklch(0.55_0.2_20/0.3)]",
  }
  const styleKey = status && styles[status] ? status : "queued"
  const label =
    status && status.length > 0 ? status.charAt(0).toUpperCase() + status.slice(1) : "Queued"

  return (
    <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-2 ${styles[styleKey]}`}>
      {styleKey === "processing" && (
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      )}
      {styleKey === "done" && (
        <span className="w-2 h-2 rounded-full bg-current" />
      )}
      {label}
    </span>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
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
