export type StyleType =
  | "photorealistic"
  | "cinematic"
  | "artistic"
  | "anime"
  | "sketch"
  | "3d-render"
  | "flat"
  | "product-photo"
export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "4:5" | "3:4"
export type ImageSize = "1K" | "2K" | "4K"
export type JobStatus = "queued" | "processing" | "done" | "failed"
export type OutputFormat = "png" | "jpg" | "webp"
export type BackgroundMode = "none" | "remove" | "replace" | "blur"
export type BrushSize = "small" | "medium" | "large"

export type PresetType = "ecommerce" | "social" | "poster" | "avatar" | "custom"

export interface ImageAdjustments {
  brightness: number // 0-100, default 50
  contrast: number // 0-100, default 50
  saturation: number // 0-100, default 50
  sharpness: number // 0-100, default 50
}

export interface EditTools {
  backgroundMode: BackgroundMode
  backgroundPrompt?: string // For replace mode
  inpaintingEnabled: boolean
  brushSize: BrushSize
  colorSwap?: {
    targetColor: string
    replaceColor: string
  }
}

export interface GenerationSettings {
  style: StyleType
  aspectRatio: AspectRatio
  imageSize: ImageSize
  useGoogleSearch: boolean
  outputFormat: OutputFormat
  adjustments: ImageAdjustments
  editTools: EditTools
  preset: PresetType
}

export interface Job {
  jobId: string
  deviceId: string
  status: JobStatus
  originalPrompt: string
  enhancedPrompt?: string
  previewUrl?: string // Low-res quick preview
  finalUrl?: string // Full resolution
  assetId?: string
  settings?: GenerationSettings
  thoughtSignature?: string
  conversationHistory?: ConversationTurn[]
  error?: string
  createdAt: string
  updatedAt: string
  progressMessage?: string
}

export interface ConversationTurn {
  role: "user" | "model"
  content: string
  imageUrl?: string
}

export interface Asset {
  assetId: string
  deviceId: string
  url: string
  thumbUrl?: string
  width: number
  height: number
  mimeType: string
  createdAt: string
}

export interface ExportPreset {
  name: string
  platform: string
  width: number
  height: number
  format: OutputFormat
  quality: number
}

export const EXPORT_PRESETS: ExportPreset[] = [
  { name: "Instagram Post", platform: "instagram", width: 1080, height: 1080, format: "jpg", quality: 90 },
  { name: "Instagram Story", platform: "instagram", width: 1080, height: 1920, format: "jpg", quality: 90 },
  { name: "LinkedIn Post", platform: "linkedin", width: 1200, height: 627, format: "png", quality: 95 },
  { name: "Twitter/X Post", platform: "twitter", width: 1600, height: 900, format: "png", quality: 90 },
  { name: "16:9 Slide", platform: "presentation", width: 1920, height: 1080, format: "png", quality: 95 },
  { name: "YouTube Thumbnail", platform: "youtube", width: 1280, height: 720, format: "jpg", quality: 90 },
]

export interface QuickPreset {
  id: PresetType
  name: string
  icon: string
  aspectRatio: AspectRatio
  style: StyleType
  suggestedPrompts: string[]
}

export const QUICK_PRESETS: QuickPreset[] = [
  {
    id: "ecommerce",
    name: "E-commerce",
    icon: "shopping-bag",
    aspectRatio: "1:1",
    style: "product-photo",
    suggestedPrompts: [
      "Remove background, add soft shadow",
      "Place product on marble surface",
      "Add lifestyle context background",
    ],
  },
  {
    id: "social",
    name: "Social Post",
    icon: "share",
    aspectRatio: "1:1",
    style: "cinematic",
    suggestedPrompts: ["Add vibrant color grading", "Apply vintage film look", "Enhance with subtle vignette"],
  },
  {
    id: "poster",
    name: "Poster",
    icon: "layout",
    aspectRatio: "4:5",
    style: "artistic",
    suggestedPrompts: ["Add dramatic lighting", "Create movie poster style", "Apply bold typography space"],
  },
  {
    id: "avatar",
    name: "Avatar",
    icon: "user",
    aspectRatio: "1:1",
    style: "photorealistic",
    suggestedPrompts: ["Professional headshot lighting", "Blur background, focus face", "Add studio backdrop"],
  },
]
