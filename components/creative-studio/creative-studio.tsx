"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { toast, Toaster } from "sonner"
import { ConfigPanel, DEFAULT_ADJUSTMENTS, type AdjustmentValues, type AdjustmentKey } from "./config-panel"
import { PreviewCanvas } from "./preview-canvas"
import { HistoryPanel } from "./history-panel"
import { ExportFooter } from "./export-footer"
import { getOrCreateDeviceId } from "@/lib/device-id"
import type { Job, GenerationSettings } from "@/lib/types"

export function CreativeStudio() {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  const [jobHistory, setJobHistory] = useState<Job[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const [lastPrompt, setLastPrompt] = useState("")
  const [lastSettings, setLastSettings] = useState<GenerationSettings | null>(null)
  const [lastAssetId, setLastAssetId] = useState<string | undefined>()

  // Adjustment state
  const [adjustments, setAdjustments] = useState<AdjustmentValues>(DEFAULT_ADJUSTMENTS)
  const [appliedImageUrl, setAppliedImageUrl] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [isApplyingAdjustments, setIsApplyingAdjustments] = useState(false)
  const appliedObjectUrlRef = useRef<string | null>(null)

  // Edit from history state
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null)
  const [editAssetId, setEditAssetId] = useState<string | null>(null)

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId())
  }, [])

  useEffect(() => {
    if (currentJob?.status === "done") {
      setJobHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1)
        return [...newHistory, currentJob]
      })
      setHistoryIndex((prev) => prev + 1)
    }
  }, [currentJob]) // Updated dependency array to include currentJob

  // Reset adjustments when a new image is generated
  useEffect(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS)
    setAppliedImageUrl(null)
    setApplyError(null)
    setDownloadUrl(null)
    if (appliedObjectUrlRef.current) {
      URL.revokeObjectURL(appliedObjectUrlRef.current)
      appliedObjectUrlRef.current = null
    }
  }, [currentJob?.previewUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (appliedObjectUrlRef.current) {
        URL.revokeObjectURL(appliedObjectUrlRef.current)
      }
    }
  }, [])

  const hasAdjustmentChanges = useMemo(
    () => Object.keys(DEFAULT_ADJUSTMENTS).some(
      (key) => adjustments[key as AdjustmentKey] !== DEFAULT_ADJUSTMENTS[key as AdjustmentKey]
    ),
    [adjustments]
  )

  const handleAdjustmentChange = useCallback((key: AdjustmentKey, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleResetAdjustments = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS)
    setApplyError(null)
  }, [])

  const handleApplyAdjustments = useCallback(() => {
    const currentImageSrc = appliedImageUrl || currentJob?.finalUrl || currentJob?.previewUrl
    if (!currentImageSrc || !hasAdjustmentChanges) return

    setIsApplyingAdjustments(true)
    setApplyError(null)

    const image = new Image()
    image.crossOrigin = "anonymous"
    image.src = currentImageSrc
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = image.naturalWidth || image.width
      canvas.height = image.naturalHeight || image.height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        setApplyError("Canvas drawing is not supported in this browser.")
        setIsApplyingAdjustments(false)
        return
      }
      ctx.filter = buildCanvasFilter(adjustments)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setApplyError("Unable to encode adjusted image.")
            setIsApplyingAdjustments(false)
            toast.error("Failed to apply adjustments")
            return
          }
          if (appliedObjectUrlRef.current) {
            URL.revokeObjectURL(appliedObjectUrlRef.current)
          }
          const url = URL.createObjectURL(blob)
          appliedObjectUrlRef.current = url
          setAppliedImageUrl(url)
          setDownloadUrl(url)
          setIsApplyingAdjustments(false)
          setAdjustments(DEFAULT_ADJUSTMENTS)
          toast.success("Adjustments applied! Click Download to save.")
        },
        "image/png",
        0.95
      )
    }
    image.onerror = () => {
      setApplyError("Could not load the image for local adjustments.")
      setIsApplyingAdjustments(false)
    }
  }, [adjustments, appliedImageUrl, currentJob, hasAdjustmentChanges])

  const handleGenerate = async (prompt: string, settings: GenerationSettings, assetId?: string, isHD = false, isToolOperation = false) => {
    if (!deviceId) return

    // Store for retry
    setLastPrompt(prompt)
    setLastSettings(settings)
    setLastAssetId(assetId)

    setIsGenerating(true)
    try {
      let finalPrompt = prompt
      
      // Only enhance prompt for creative generation, NOT for tool operations
      if (!isToolOperation && !assetId) {
        const enhanceRes = await fetch("/api/enhance-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, style: settings.style }),
        })
        const { enhancedPrompt } = await enhanceRes.json()
        finalPrompt = enhancedPrompt
      }
      // For tool operations or image editing, use the prompt directly without enhancement

      // Create the generation/edit job
      const editRes = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          originalPrompt: prompt,
          assetId,
          settings,
          deviceId,
          conversationHistory: currentJob?.conversationHistory || [],
          thoughtSignature: currentJob?.thoughtSignature,
          isHD,
          isToolOperation,
        }),
      })
      const job: Job = await editRes.json()
      setCurrentJob(job)

      // Poll for completion
      pollJobStatus(job.jobId)
    } catch (error) {
      console.error("Generation failed:", error)
      setIsGenerating(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      const res = await fetch(`/api/job/${jobId}`)
      const job: Job = await res.json()
      setCurrentJob(job)

      if (job.status === "done" || job.status === "failed") {
        setIsGenerating(false)
        setHistoryRefreshKey((k) => k + 1)
        
        // Show toast notification
        if (job.status === "done") {
          toast.success("Image generated successfully!")
        } else {
          toast.error("Generation failed. Please try again.")
        }
      } else {
        setTimeout(poll, 2000)
      }
    }
    poll()
  }

  const handleGenerateHd = () => {
    if (!deviceId) return false
    const sourcePrompt = lastPrompt || currentJob?.originalPrompt
    const sourceSettings = lastSettings || currentJob?.settings
    const sourceAsset = lastAssetId || currentJob?.assetId

    if (!sourcePrompt || !sourceSettings) {
      return false
    }

    const hdSettings: GenerationSettings = { ...sourceSettings, imageSize: "4K" }
    handleGenerate(sourcePrompt, hdSettings, sourceAsset, true)
    return true
  }

  const handleSelectFromHistory = (job: Job) => {
    setCurrentJob(job)
  }

  const handleEditFromHistory = useCallback((job: Job) => {
    // Set the image for editing in config panel
    if (job.previewUrl) {
      setEditImageUrl(job.previewUrl)
      setEditAssetId(job.assetId || null)
    }
  }, [])

  const clearEditImage = useCallback(() => {
    setEditImageUrl(null)
    setEditAssetId(null)
  }, [])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1)
      setCurrentJob(jobHistory[historyIndex - 1])
    }
  }, [historyIndex, jobHistory])

  const handleRedo = useCallback(() => {
    if (historyIndex < jobHistory.length - 1) {
      setHistoryIndex((prev) => prev + 1)
      setCurrentJob(jobHistory[historyIndex + 1])
    }
  }, [historyIndex, jobHistory])

  const handleRetry = useCallback(() => {
    if (lastPrompt && lastSettings) {
      const lowerQualitySettings = { ...lastSettings, imageSize: "1K" as const }
      handleGenerate(lastPrompt, lowerQualitySettings, lastAssetId, false)
    }
  }, [lastPrompt, lastSettings, lastAssetId])

  if (!deviceId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-panel p-6">
          <div className="animate-pulse">Initializing Studio...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Toast notifications */}
      <Toaster position="top-right" richColors closeButton />
      
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/20 via-background to-cyan-950/20 pointer-events-none" />

      {/* Main layout */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="glass-panel m-4 mb-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Creative Studio</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Image Generation & Editing</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs mr-1">Ctrl+Z</kbd> Undo
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs ml-3 mr-1">Ctrl+Shift+Z</kbd> Redo
            </span>
            <div className="text-xs text-muted-foreground font-mono">ID: {deviceId.slice(0, 8)}...</div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Left: Config Panel */}
          <ConfigPanel
            onGenerate={handleGenerate}
            onGenerateHd={handleGenerateHd}
            isGenerating={isGenerating}
            currentJob={currentJob}
            adjustments={adjustments}
            onAdjustmentChange={handleAdjustmentChange}
            onResetAdjustments={handleResetAdjustments}
            onApplyAdjustments={handleApplyAdjustments}
            isApplyingAdjustments={isApplyingAdjustments}
            hasAdjustmentChanges={hasAdjustmentChanges}
            downloadUrl={downloadUrl}
            applyError={applyError}
            editImageUrl={editImageUrl}
            editAssetId={editAssetId}
            onClearEditImage={clearEditImage}
          />

          {/* Center: Preview Canvas */}
          <PreviewCanvas
            job={currentJob}
            isGenerating={isGenerating}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < jobHistory.length - 1}
            onRetry={handleRetry}
            adjustments={adjustments}
            appliedImageUrl={appliedImageUrl}
          />

          {/* Right: History Panel */}
          <HistoryPanel 
            deviceId={deviceId} 
            onSelect={handleSelectFromHistory} 
            onEdit={handleEditFromHistory}
            refreshKey={historyRefreshKey} 
          />
        </div>

        {/* Footer */}
        <ExportFooter job={currentJob} />
      </div>
    </div>
  )
}

function buildCanvasFilter(adj: AdjustmentValues) {
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

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  )
}
