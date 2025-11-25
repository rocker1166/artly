"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  Job,
  GenerationSettings,
  StyleType,
  AspectRatio,
  ImageSize,
  OutputFormat,
  BrushSize,
  QuickPreset,
} from "@/lib/types"
import { QUICK_PRESETS } from "@/lib/types"

export const DEFAULT_ADJUSTMENTS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  clarity: 50,
}

export type AdjustmentValues = typeof DEFAULT_ADJUSTMENTS
export type AdjustmentKey = keyof AdjustmentValues

interface ConfigPanelProps {
  onGenerate: (prompt: string, settings: GenerationSettings, assetId?: string, isHD?: boolean, isToolOperation?: boolean) => void
  onGenerateHd?: () => boolean
  isGenerating: boolean
  currentJob: Job | null
  adjustments: AdjustmentValues
  onAdjustmentChange: (key: AdjustmentKey, value: number) => void
  onResetAdjustments: () => void
  onApplyAdjustments: () => void
  isApplyingAdjustments: boolean
  hasAdjustmentChanges: boolean
  downloadUrl: string | null
  applyError: string | null
  editImageUrl?: string | null
  editAssetId?: string | null
  onClearEditImage?: () => void
}

const PLACEHOLDER_PROMPTS = [
  "Remove background",
  "Make t-shirt red",
  "Add mountain background",
  "Crop to Instagram 4:5 + subtle vignette",
  "Apply cinematic color grading",
  "Blur background, focus subject",
]

export function ConfigPanel({
  onGenerate,
  onGenerateHd,
  isGenerating,
  currentJob,
  adjustments,
  onAdjustmentChange,
  onResetAdjustments,
  onApplyAdjustments,
  isApplyingAdjustments,
  hasAdjustmentChanges,
  downloadUrl,
  applyError,
  editImageUrl,
  editAssetId,
  onClearEditImage,
}: ConfigPanelProps) {
  const [prompt, setPrompt] = useState("")
  const [settings, setSettings] = useState<GenerationSettings>({
    style: "photorealistic",
    aspectRatio: "1:1",
    imageSize: "1K",
    useGoogleSearch: false,
    outputFormat: "png",
    preset: "custom",
    adjustments: {
      brightness: 50,
      contrast: 50,
      saturation: 50,
      sharpness: 50,
    },
    editTools: {
      backgroundMode: "none",
      inpaintingEnabled: false,
      brushSize: "medium",
    },
  })
  const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null)
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [activeTab, setActiveTab] = useState("prompt")

  const [promptSuggestions, setPromptSuggestions] = useState<string[]>(PLACEHOLDER_PROMPTS.slice(0, 3))

  // Load edit image from history when provided
  useEffect(() => {
    if (editImageUrl) {
      setUploadedPreview(editImageUrl)
      setUploadedAssetId(editAssetId || "from-history")
      setActiveTab("prompt") // Switch to prompt tab for editing
    }
  }, [editImageUrl, editAssetId])

  const hasSourceImage = Boolean(uploadedAssetId)
  const trimmedPrompt = prompt.trim()
  const promptWordCount = trimmedPrompt ? trimmedPrompt.split(/\s+/).filter(Boolean).length : 0
  const isPromptValid = promptWordCount >= 2
  
  // Check if any tool is configured (doesn't need prompt)
  const hasToolConfigured = 
    settings.editTools.backgroundMode !== "none" ||
    (settings.editTools.colorSwap?.targetColor && settings.editTools.colorSwap?.replaceColor)
  
  // Can submit if: has valid prompt OR (has source image AND has tool configured)
  const canSubmit = isPromptValid || (hasSourceImage && hasToolConfigured)
  
  const promptHint =
    !trimmedPrompt && !hasToolConfigured
      ? "Add a prompt or select a tool action."
      : !isPromptValid && !hasToolConfigured
        ? "Add at least two descriptive words to guide the model."
        : promptWordCount > 0 && promptWordCount < 5
          ? "Extra detail produces more reliable results."
          : null
  const hdDisabled = isGenerating || (!canSubmit && !currentJob)
  const previewDisabled = isGenerating || !canSubmit

  const applyPreset = (preset: QuickPreset) => {
    setSettings((prev) => ({
      ...prev,
      preset: preset.id,
      aspectRatio: preset.aspectRatio,
      style: preset.style,
    }))
    setPromptSuggestions(preset.suggestedPrompts)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      await uploadFile(file)
    }
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      setUploadedAssetId(data.assetId)
      setUploadedPreview(data.url)
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlPaste = async () => {
    if (!urlInput.trim()) return
    setIsUploading(true)
    try {
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      })
      const data = await res.json()
      if (data.assetId) {
        setUploadedAssetId(data.assetId)
        setUploadedPreview(data.url)
        setUrlInput("")
      }
    } catch (error) {
      console.error("URL upload failed:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (isHD = false) => {
    // Build tool instruction if tools are configured
    let toolPrompt = ""
    if (settings.editTools.backgroundMode === "remove") {
      toolPrompt = "Remove the background completely, make it transparent or white."
    } else if (settings.editTools.backgroundMode === "replace" && settings.editTools.backgroundPrompt) {
      toolPrompt = `Replace the background with: ${settings.editTools.backgroundPrompt}`
    } else if (settings.editTools.backgroundMode === "blur") {
      toolPrompt = "Apply a professional blur effect to the background, keeping the subject sharp and in focus."
    }
    
    if (settings.editTools.colorSwap?.targetColor && settings.editTools.colorSwap?.replaceColor) {
      const colorInstruction = `Change all ${settings.editTools.colorSwap.targetColor} colors to ${settings.editTools.colorSwap.replaceColor}.`
      toolPrompt = toolPrompt ? `${toolPrompt} ${colorInstruction}` : colorInstruction
    }
    
    // Use tool prompt, user prompt, or both
    const finalPrompt = toolPrompt 
      ? (prompt.trim() ? `${prompt.trim()}. ${toolPrompt}` : toolPrompt)
      : prompt.trim()
    
    if (!finalPrompt) return
    
    const finalSettings = isHD ? { ...settings, imageSize: "4K" as ImageSize } : settings
    // Pass a flag to indicate this is a tool operation (skip prompt enhancement)
    const isToolOperation = Boolean(toolPrompt)
    onGenerate(finalPrompt, finalSettings, uploadedAssetId || undefined, isHD, isToolOperation)
  }

  const handleHdClick = () => {
    const wasHandled = onGenerateHd?.()
    if (wasHandled) return
    if (!isPromptValid) return
    handleSubmit(true)
  }

  const clearUpload = () => {
    setUploadedAssetId(null)
    setUploadedPreview(null)
    onClearEditImage?.()
  }

  const updateEditTool = <K extends keyof typeof settings.editTools>(key: K, value: (typeof settings.editTools)[K]) => {
    setSettings((prev) => ({
      ...prev,
      editTools: { ...prev.editTools, [key]: value },
    }))
  }

  return (
    <div className="w-[400px] flex-shrink-0 glass-panel p-6 flex flex-col gap-5 overflow-y-auto noise-overlay">
      {/* Quick Presets */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold tracking-wide text-foreground/90 uppercase">Quick Presets</Label>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`group p-3 rounded-xl border text-center transition-all duration-200 ${
                settings.preset === preset.id
                  ? "border-[oklch(0.72_0.18_195)] bg-[oklch(0.72_0.18_195/0.15)] text-[oklch(0.8_0.15_195)] shadow-[0_0_20px_oklch(0.72_0.18_195/0.2)]"
                  : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/6"
              }`}
            >
              <PresetIcon type={preset.icon} className={`w-5 h-5 mx-auto mb-1.5 transition-transform group-hover:scale-110 ${
                settings.preset === preset.id ? "text-[oklch(0.8_0.15_195)]" : "text-muted-foreground"
              }`} />
              <span className="text-xs font-medium">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Image Input Area */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold tracking-wide text-foreground/90 uppercase">Input Image</Label>
        {uploadedPreview ? (
          <div className="relative group rounded-xl overflow-hidden border border-white/10">
            <img
              src={uploadedPreview || "/placeholder.svg"}
              alt="Uploaded"
              className="w-full h-36 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <button
              onClick={clearUpload}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-red-500/80 hover:border-red-400/50 transition-all"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label
              className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-[oklch(0.72_0.18_195/0.5)] hover:bg-[oklch(0.72_0.18_195/0.05)] transition-all duration-200 group"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3 group-hover:bg-[oklch(0.72_0.18_195/0.1)] transition-colors">
                <UploadIcon className="w-6 h-6 text-muted-foreground group-hover:text-[oklch(0.72_0.18_195)]" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">
                {isUploading ? "Uploading..." : "Drop image or click to upload"}
              </span>
              <span className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, WebP up to 10MB</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Or paste image URL..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="glass-input flex-1 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleUrlPaste}
                disabled={!urlInput.trim() || isUploading}
                className="border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
              >
                Load
              </Button>
            </div>
            {/* Sample Images */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {[1, 2, 3].map((i) => (
                <button
                  key={i}
                  onClick={() => setUrlInput(`/placeholder.svg?height=512&width=512&query=sample product image ${i}`)}
                  className="w-9 h-9 rounded-lg border border-white/10 hover:border-[oklch(0.72_0.18_195/0.5)] hover:ring-2 hover:ring-[oklch(0.72_0.18_195/0.2)] overflow-hidden transition-all"
                >
                  <img
                    src={`/abstract-colorful-swirl.png?height=32&width=32&query=sample ${i}`}
                    alt={`Sample ${i}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Core output settings */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Style</Label>
          <Select value={settings.style} onValueChange={(v: StyleType) => setSettings({ ...settings, style: v })}>
            <SelectTrigger className="bg-background/50 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="photorealistic">Realistic</SelectItem>
              <SelectItem value="cinematic">Cinematic</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
              <SelectItem value="product-photo">Product Photo</SelectItem>
              <SelectItem value="artistic">Artistic</SelectItem>
              <SelectItem value="anime">Anime</SelectItem>
              <SelectItem value="sketch">Sketch</SelectItem>
              <SelectItem value="3d-render">3D Render</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Aspect Ratio</Label>
          <div className="grid grid-cols-6 gap-1">
            {(["1:1", "16:9", "9:16", "4:3", "4:5", "3:4"] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setSettings({ ...settings, aspectRatio: ratio })}
                className={`py-2 text-xs rounded-lg border transition-all ${
                  settings.aspectRatio === ratio
                    ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Output Format</Label>
          <div className="flex gap-2">
            {(["png", "jpg", "webp"] as OutputFormat[]).map((format) => (
              <button
                key={format}
                onClick={() => setSettings({ ...settings, outputFormat: format })}
                className={`flex-1 py-2 text-xs rounded-lg border uppercase transition-all ${
                  settings.outputFormat === format
                    ? "border-violet-500 bg-violet-500/20 text-violet-400"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {format}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Config summary */}
      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground/80 border border-white/5 rounded-lg p-3 bg-black/10">
        <div>
          <p className="uppercase tracking-wide text-[10px] text-muted-foreground/70">Style</p>
          <p className="font-medium text-foreground">{settings.style}</p>
        </div>
        <div>
          <p className="uppercase tracking-wide text-[10px] text-muted-foreground/70">Aspect</p>
          <p className="font-medium text-foreground">{settings.aspectRatio}</p>
        </div>
        <div>
          <p className="uppercase tracking-wide text-[10px] text-muted-foreground/70">Format</p>
          <p className="font-medium text-foreground uppercase">{settings.outputFormat}</p>
        </div>
      </div>

      {/* Tabs for different settings */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid grid-cols-3 bg-background/50">
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="tools" disabled={!hasSourceImage} className={!hasSourceImage ? "opacity-40 cursor-not-allowed" : ""}>
            Tools
          </TabsTrigger>
          <TabsTrigger 
            value="adjust" 
            disabled={!currentJob?.previewUrl} 
            className={!currentJob?.previewUrl ? "opacity-40 cursor-not-allowed" : ""}
          >
            Adjust
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="space-y-4 mt-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Describe what you want to create or how to edit..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] bg-background/50 border-white/10 resize-none"
            />
            {/* Prompt Suggestions */}
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(suggestion)}
                  className="px-2 py-1 text-xs rounded-full bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            {promptHint && <p className="text-xs text-amber-400">{promptHint}</p>}
          </div>

        </TabsContent>

        <TabsContent value="tools" className="space-y-4 mt-4">
          {!hasSourceImage ? (
            <div className="rounded-lg border border-dashed border-white/10 bg-black/10 p-4 text-center text-sm text-muted-foreground">
              Upload or paste an input image to unlock background removal, inpainting, and color tools.
            </div>
          ) : (
            <>
              {/* Background Mode */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { value: "none", label: "None" },
                      { value: "remove", label: "Remove" },
                      { value: "replace", label: "Replace" },
                      { value: "blur", label: "Blur" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateEditTool("backgroundMode", opt.value)}
                      className={`py-2 text-xs rounded-lg border transition-all ${
                        settings.editTools.backgroundMode === opt.value
                          ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {settings.editTools.backgroundMode === "replace" && (
                  <input
                    type="text"
                    placeholder="Describe new background..."
                    value={settings.editTools.backgroundPrompt || ""}
                    onChange={(e) => updateEditTool("backgroundPrompt", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-background/50 border border-white/10 rounded-lg mt-2"
                  />
                )}
              </div>

              {/* Inpainting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Inpainting Mode</Label>
                    <p className="text-xs text-muted-foreground">Brush to mark edit areas</p>
                  </div>
                  <Switch
                    checked={settings.editTools.inpaintingEnabled}
                    onCheckedChange={(v) => updateEditTool("inpaintingEnabled", v)}
                  />
                </div>
                {settings.editTools.inpaintingEnabled && (
                  <div className="flex gap-2">
                    {(["small", "medium", "large"] as BrushSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => updateEditTool("brushSize", size)}
                        className={`flex-1 py-2 text-xs rounded-lg border capitalize transition-all ${
                          settings.editTools.brushSize === size
                            ? "border-amber-500 bg-amber-500/20 text-amber-400"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Color Swap */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Color Swap</Label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Target (e.g., red)"
                      className="w-full px-3 py-2 text-xs bg-background/50 border border-white/10 rounded-lg"
                      onChange={(e) =>
                        updateEditTool("colorSwap", {
                          ...settings.editTools.colorSwap,
                          targetColor: e.target.value,
                          replaceColor: settings.editTools.colorSwap?.replaceColor || "",
                        })
                      }
                    />
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Replace (e.g., blue)"
                      className="w-full px-3 py-2 text-xs bg-background/50 border border-white/10 rounded-lg"
                      onChange={(e) =>
                        updateEditTool("colorSwap", {
                          targetColor: settings.editTools.colorSwap?.targetColor || "",
                          replaceColor: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Google Search */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Use Google Search</Label>
                  <p className="text-xs text-muted-foreground">Ground with web results</p>
                </div>
                <Switch
                  checked={settings.useGoogleSearch}
                  onCheckedChange={(v) => setSettings({ ...settings, useGoogleSearch: v })}
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="adjust" className="space-y-4 mt-4">
          {!currentJob?.previewUrl ? (
            <div className="rounded-lg border border-dashed border-white/10 bg-black/10 p-4 text-center text-sm text-muted-foreground">
              Generate an image first to enable adjustments.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">In-browser adjustments</p>
                <button
                  onClick={onResetAdjustments}
                  disabled={!hasAdjustmentChanges}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </div>

              <AdjustmentSlider
                label="Brightness"
                value={adjustments.brightness}
                min={50}
                max={150}
                onChange={(v) => onAdjustmentChange("brightness", v)}
              />
              <AdjustmentSlider
                label="Contrast"
                value={adjustments.contrast}
                min={50}
                max={150}
                onChange={(v) => onAdjustmentChange("contrast", v)}
              />
              <AdjustmentSlider
                label="Saturation"
                value={adjustments.saturation}
                min={50}
                max={200}
                onChange={(v) => onAdjustmentChange("saturation", v)}
              />
              <AdjustmentSlider
                label="Clarity / Sharpness"
                value={adjustments.clarity}
                min={0}
                max={100}
                onChange={(v) => onAdjustmentChange("clarity", v)}
              />

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={onApplyAdjustments}
                  disabled={!hasAdjustmentChanges || isApplyingAdjustments}
                  className="bg-cyan-600 hover:bg-cyan-500"
                >
                  {isApplyingAdjustments ? "Applying..." : "Apply Changes"}
                </Button>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download="creative-studio-adjusted.png"
                    className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-xs font-medium text-foreground hover:bg-white/5"
                  >
                    Download
                  </a>
                )}
              </div>

              {applyError && <p className="text-xs text-red-400">{applyError}</p>}
              {!applyError && (
                <p className="text-[11px] text-muted-foreground">
                  Tweaks happen locally in your browser. Download the adjusted version to save.
                </p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Generate Buttons */}
      <div className="space-y-3 pt-4 border-t border-white/8 mt-auto">
        <Button
          onClick={() => handleSubmit(false)}
          disabled={previewDisabled}
          title={!canSubmit ? "Add a prompt or select a tool action" : undefined}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[oklch(0.65_0.22_290)] to-[oklch(0.72_0.18_195)] hover:from-[oklch(0.7_0.22_290)] hover:to-[oklch(0.77_0.18_195)] text-white border-0 shadow-lg hover:shadow-[0_0_30px_oklch(0.65_0.22_290/0.3),0_0_30px_oklch(0.72_0.18_195/0.3)] transition-all duration-300"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <LoaderIcon className="w-5 h-5 animate-spin" />
              {currentJob?.progressMessage || "Processing..."}
            </span>
          ) : hasToolConfigured && hasSourceImage ? (
            <span className="flex items-center gap-2">
              <WandIcon className="w-5 h-5" />
              Apply Tool
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5" />
              Generate Preview
            </span>
          )}
        </Button>
        <Button
          onClick={handleHdClick}
          disabled={hdDisabled}
          variant="outline"
          className="w-full h-11 font-semibold border-white/10 bg-white/3 hover:bg-white/8 hover:border-[oklch(0.75_0.18_85/0.5)] group transition-all duration-200"
        >
          <span className="flex items-center gap-2">
            <HDIcon className="w-4 h-4 group-hover:text-[oklch(0.8_0.16_85)]" />
            <span>Generate HD</span>
            <span className="px-2 py-0.5 rounded-md bg-[oklch(0.75_0.18_85/0.15)] text-[oklch(0.8_0.16_85)] text-xs font-medium border border-[oklch(0.75_0.18_85/0.3)]">4K</span>
          </span>
        </Button>
      </div>
    </div>
  )
}

// Icon Components
function PresetIcon({ type, className }: { type: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    "shopping-bag": (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    share: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
        />
      </svg>
    ),
    layout: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
      </svg>
    ),
    user: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  }
  return <>{icons[type] || null}</>
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
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

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  )
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

function HDIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  )
}

function WandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
      />
    </svg>
  )
}

function AdjustmentSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={1} />
    </div>
  )
}
