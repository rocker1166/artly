"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { toast, Toaster } from "sonner"
import { ConfigPanel, DEFAULT_ADJUSTMENTS, type AdjustmentValues, type AdjustmentKey } from "./config-panel"
import { PreviewCanvas } from "./preview-canvas"
import { HistoryPanel } from "./history-panel"
import { ExportFooter } from "./export-footer"
import { getOrCreateDeviceId } from "@/lib/device-id"
import type { Job, GenerationSettings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { KeyRound } from "lucide-react"

const GEMINI_KEY_STORAGE_KEY = "artly-gemini-api-key"

interface CreativeStudioProps {
  onLogoClick?: () => void
}

export function CreativeStudio({ onLogoClick }: CreativeStudioProps = {}) {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  const [jobHistory, setJobHistory] = useState<Job[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const [customGeminiKey, setCustomGeminiKey] = useState<string | null>(null)
  const [pendingGeminiKey, setPendingGeminiKey] = useState("")
  const [isValidatingGeminiKey, setIsValidatingGeminiKey] = useState(false)
  const [geminiKeyState, setGeminiKeyState] = useState<"idle" | "valid" | "invalid">("idle")
  const [geminiKeyMessage, setGeminiKeyMessage] = useState("")

  const [lastPrompt, setLastPrompt] = useState("")
  const [lastSettings, setLastSettings] = useState<GenerationSettings | null>(null)
  const [lastAssetId, setLastAssetId] = useState<string | undefined>()

  const effectiveGeminiKey = useMemo(() => customGeminiKey?.trim() || undefined, [customGeminiKey])

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
  const previewSectionRef = useRef<HTMLDivElement | null>(null)

  const scrollToPreview = useCallback(() => {
    if (typeof window === "undefined") return
    if (window.innerWidth > 768) return
    previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [previewSectionRef])

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId())
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedKey = window.localStorage.getItem(GEMINI_KEY_STORAGE_KEY)
    if (storedKey) {
      setCustomGeminiKey(storedKey)
      setPendingGeminiKey(storedKey)
      setGeminiKeyState("valid")
      setGeminiKeyMessage("Personal Gemini key loaded")
    }
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

  const handleValidateGeminiKey = useCallback(async () => {
    const trimmedKey = pendingGeminiKey.trim()

    if (!trimmedKey) {
      setGeminiKeyState("invalid")
      setGeminiKeyMessage("Enter an API key before saving.")
      return
    }

    setIsValidatingGeminiKey(true)
    setGeminiKeyState("idle")
    setGeminiKeyMessage("")

    try {
      const res = await fetch("/api/validate-gemini-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmedKey }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Provided key is not valid.")
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(GEMINI_KEY_STORAGE_KEY, trimmedKey)
      }
      setCustomGeminiKey(trimmedKey)
      setGeminiKeyState("valid")
      setGeminiKeyMessage("Personal key saved and validated.")
      toast.success("Personal Gemini API key saved.")
    } catch (error: any) {
      const message = error?.message || "Unable to validate API key."
      setGeminiKeyState("invalid")
      setGeminiKeyMessage(message)
      toast.error(message)
    } finally {
      setIsValidatingGeminiKey(false)
    }
  }, [pendingGeminiKey])

  const handleClearGeminiKey = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(GEMINI_KEY_STORAGE_KEY)
    }
    setCustomGeminiKey(null)
    setPendingGeminiKey("")
    setGeminiKeyState("idle")
    setGeminiKeyMessage("Reverted to the shared studio key.")
    toast.success("Personal Gemini key cleared.")
  }, [])

  const fallbackToStudioKey = useCallback(
    (message?: string) => {
      if (!customGeminiKey) return
      const fallbackMessage = message || "Personal key failed. Using the studio key for this request."
      setGeminiKeyState("invalid")
      setGeminiKeyMessage(fallbackMessage)
      toast.warning(fallbackMessage)
    },
    [customGeminiKey],
  )

  const callGeminiApiWithFallback = useCallback(
    async (url: string, payload: Record<string, unknown>) => {
      const sendRequest = (override?: string) =>
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(override ? { ...payload, apiKeyOverride: override } : payload),
        })

      if (!effectiveGeminiKey) {
        return sendRequest()
      }

      try {
        const response = await sendRequest(effectiveGeminiKey)
        if (response.ok) {
          return response
        }
        fallbackToStudioKey("Personal key responded with an error. Switched to the studio key.")
        return sendRequest()
      } catch (error) {
        fallbackToStudioKey("Personal key request failed. Switched to the studio key.")
        return sendRequest()
      }
    },
    [effectiveGeminiKey, fallbackToStudioKey],
  )

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
    scrollToPreview()
    try {
      let finalPrompt = prompt
      
      // Only enhance prompt for creative generation, NOT for tool operations
      if (!isToolOperation && !assetId) {
        const enhanceRes = await callGeminiApiWithFallback("/api/enhance-prompt", {
          prompt,
          style: settings.style,
        })

        const enhancePayload = await enhanceRes.json().catch(() => null)
        if (!enhanceRes.ok) {
          throw new Error(enhancePayload?.error || "Failed to enhance prompt")
        }

        finalPrompt = enhancePayload?.enhancedPrompt || prompt
      }
      // For tool operations or image editing, use the prompt directly without enhancement

      // Create the generation/edit job
      const editRes = await callGeminiApiWithFallback("/api/edit", {
        prompt: finalPrompt,
        originalPrompt: prompt,
        assetId,
        settings,
        deviceId,
        conversationHistory: currentJob?.conversationHistory || [],
        thoughtSignature: currentJob?.thoughtSignature,
        isHD,
        isToolOperation,
      })

      const jobPayload = await editRes.json().catch(() => null)
      if (!editRes.ok || !jobPayload) {
        throw new Error(jobPayload?.error || "Failed to create job")
      }

      const job: Job = jobPayload
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
    scrollToPreview()
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
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          },
        }}
      />
      
      {/* Animated gradient background */}
      <div className="fixed inset-0 gradient-bg pointer-events-none" />
      
      {/* Noise texture overlay for depth */}
      <div className="fixed inset-0 noise-overlay pointer-events-none opacity-50" />

      {/* Main layout */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="glass-panel m-4 mb-0 p-5 flex flex-wrap items-center gap-4 justify-between noise-overlay">
          <button
            onClick={onLogoClick}
            className="flex items-center gap-4 group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-2xl px-1"
            title={onLogoClick ? "Return to Artly intro" : undefined}
          >
            {/* Animated logo */}
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-[oklch(0.65_0.22_290)] to-[oklch(0.72_0.18_195)] blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight text-white">
                {onLogoClick ? "Artly Studio" : "Creative Studio"}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">AI-Powered Image Generation & Editing</p>
            </div>
          </button>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <Tooltip>
               
                <TooltipContent side="bottom" className="max-w-xs text-left">
                  {customGeminiKey
                    ? "Your personal Gemini API key is active. We'll fall back to the studio key automatically if your key fails."
                    : "Add your own Gemini API key to keep generating when the shared studio key hits rate limits."}
                </TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="border border-white/10 bg-white/5 text-xs font-semibold tracking-wide uppercase text-white/80 hover:bg-white/10"
                      >
                        Gemini API
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-left">
                    Configure a backup Gemini API key. Use it when you see rate-limit errors so you can keep working without
                    waiting for shared quota resets.
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent
                  align="end"
                  className="w-80 space-y-4 bg-background/95 p-4 backdrop-blur"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Personal Gemini API key</p>
                    <p className="text-xs text-muted-foreground">
                      Use your own key when our shared key hits rate limits.
                    </p>
                  </div>
                  <a
                    href="https://aistudio.google.com/app/prompts/new_freeform"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Get a Gemini key from Google AI Studio ↗
                  </a>
                  <Input
                    type="password"
                    placeholder="Paste your Gemini API key"
                    value={pendingGeminiKey}
                    onChange={(event) => setPendingGeminiKey(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={handleValidateGeminiKey}
                      disabled={isValidatingGeminiKey}
                    >
                      {isValidatingGeminiKey ? "Validating..." : "Save key"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleClearGeminiKey}
                      disabled={!customGeminiKey}
                    >
                      Clear
                    </Button>
                  </div>
                  <p
                    className={`text-xs ${
                      geminiKeyState === "invalid"
                        ? "text-destructive"
                        : geminiKeyState === "valid"
                          ? "text-emerald-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {geminiKeyMessage ||
                      (customGeminiKey ? "Personal key is currently in use." : "Using the shared studio key.")}
                  </p>
                </DropdownMenuContent>
              </DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={`gap-2 text-[12px] tracking-wide ${
                      customGeminiKey
                        ? "border-emerald-400/60 text-emerald-100 bg-emerald-400/10 hover:bg-emerald-400/20"
                        : "border-white/20 text-white/80 bg-transparent hover:bg-white/5"
                    }`}
                  >
                    <KeyRound className="size-4" />
                    {customGeminiKey ? "Personal key" : "Studio key"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left text-foreground bg-card/95 backdrop-blur">
                  <p className="font-semibold">Why add your own key?</p>
                  <p className="text-xs opacity-80">
                    Provide a personal Gemini API key to keep generating when the shared studio key hits rate limits or
                    quotas.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-muted-foreground font-mono">{deviceId.slice(0, 8)}</span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-5 p-4 lg:p-5 lg:pt-4 overflow-y-auto lg:overflow-hidden">
          <div className="flex flex-col gap-5 lg:flex-row flex-1 min-h-0 lg:h-full">
            <div className="order-1 lg:order-1 w-full lg:max-w-[420px] lg:overflow-y-auto lg:h-full">
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
            </div>

            <div
              ref={previewSectionRef}
              className="order-2 lg:order-2 flex-1 min-h-[360px] lg:h-full"
            >
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
            </div>

            <div className="order-3 lg:order-3 w-full lg:w-72 lg:self-stretch lg:overflow-y-auto lg:h-full">
              <HistoryPanel 
                deviceId={deviceId} 
                onSelect={handleSelectFromHistory} 
                onEdit={handleEditFromHistory}
                refreshKey={historyRefreshKey} 
              />
            </div>
          </div>
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


