import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getGeminiClient } from "@/lib/gemini"
import { v4 as uuidv4 } from "uuid"
import type { ConversationTurn, GenerationSettings } from "@/lib/types"

type EditRequestPayload = {
  prompt: string
  originalPrompt?: string
  assetId?: string
  settings?: GenerationSettings
  deviceId: string
  conversationHistory?: ConversationTurn[]
  thoughtSignature?: string
  isHD?: boolean
  isToolOperation?: boolean
  apiKeyOverride?: string
}

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      originalPrompt,
      assetId,
      settings,
      deviceId,
      conversationHistory = [],
      thoughtSignature,
      isHD = false,
      isToolOperation = false,
      apiKeyOverride,
    } = (await req.json()) as EditRequestPayload

    if (!prompt || !deviceId) {
      return NextResponse.json({ error: "Prompt and deviceId are required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const jobId = uuidv4()

    // For tool operations, the prompt already contains the tool instructions from frontend
    // Only add additional instructions for non-tool operations
    let finalPrompt = prompt

    // Create job record
    const { error: insertError } = await supabase.from("jobs").insert({
      job_id: jobId,
      device_id: deviceId,
      status: "processing",
      original_prompt: originalPrompt || prompt,
      enhanced_prompt: finalPrompt,
      asset_id: assetId || null,
      settings: settings || {},
      thought_signature: thoughtSignature || null,
      conversation_history: conversationHistory,
    })

    if (insertError) {
      console.error("Job insert error:", insertError)
      return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
    }

    // Process in background
    const keyOverride = typeof apiKeyOverride === "string" ? apiKeyOverride.trim() : undefined

    processImageGeneration(
      jobId,
      finalPrompt,
      assetId ?? null,
      settings,
      conversationHistory,
      thoughtSignature,
      isHD,
      keyOverride,
    )

    return NextResponse.json({
      jobId,
      deviceId,
      status: "processing",
      originalPrompt: originalPrompt || prompt,
      enhancedPrompt: finalPrompt,
      settings,
      progressMessage: "Analyzing your prompt...",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Edit API failed:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

async function processImageGeneration(
  jobId: string,
  prompt: string,
  assetId: string | null,
  settings?: GenerationSettings,
  conversationHistory: ConversationTurn[] = [],
  thoughtSignature?: string,
  isHD = false,
  apiKeyOverride?: string,
) {
  const supabase = createServerSupabaseClient()
  const ai = getGeminiClient(apiKeyOverride)

  const normalizedHistory = Array.isArray(conversationHistory) ? conversationHistory : []
  let sourceAssetUrl: string | undefined

  try {
    await supabase
      .from("jobs")
      .update({
        progress_message: "Enhancing details...",
      })
      .eq("job_id", jobId)

    let sourceInlineData: InlineImagePart | null = null

    if (assetId) {
      await supabase
        .from("jobs")
        .update({
          progress_message: "Loading source image...",
        })
        .eq("job_id", jobId)

      const { data: asset } = await supabase
        .from("assets")
        .select("url,mime_type")
        .eq("asset_id", assetId)
        .single()

      if (asset?.url) {
        sourceAssetUrl = asset.url
        sourceInlineData = await fetchInlineData(asset.url, asset.mime_type || undefined)
      }
    }

    // Build contents according to banana3.md JavaScript examples
    // Simple text-only: contents = prompt (string)
    // Text + image: contents = [{ text: "..." }, { inlineData: {...} }]
    const modelName = selectImageModel()
    const config = buildGenerationConfig(settings, isHD)
    
    await supabase
      .from("jobs")
      .update({
        progress_message: "Generating pixels...",
      })
      .eq("job_id", jobId)
    
    // Build contents matching banana.md format exactly
    let contents: any
    if (!sourceInlineData) {
      // Simple text-only prompt - use string format
      contents = prompt
    } else {
      // Text + image - use parts array
      contents = [{ text: prompt }, { inlineData: sourceInlineData }]
    }
    
    // Exact format from banana3.md for gemini-3-pro-image-preview
    console.log("Gemini request:", {
      model: modelName,
      contents: typeof contents === "string" ? contents.substring(0, 100) + "..." : "[array with image]",
      config,
    })
    
    let response: any
    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents,
        config,
      })
    } catch (err: any) {
      console.error("Gemini API error:", err?.message || err)
      console.error("Full error:", JSON.stringify(err, null, 2))
      throw err
    }

    let imageUrl: string | null = null
    let responseText = ""
    let newThoughtSignature: string | undefined = thoughtSignature

    // Parse response - both chat and generateContent have same structure
    const candidates = response.candidates || (response as any).candidates
    const parts = candidates?.[0]?.content?.parts || []
    
    for (const part of parts) {
      if (part.text) {
        responseText = part.text.trim()
      }

      if (part.inlineData?.data) {
        await supabase
          .from("jobs")
          .update({
            progress_message: "Adding finishing touches...",
          })
          .eq("job_id", jobId)

        const mimeType = part.inlineData.mimeType || "image/png"
        const fileExtension = mimeTypeToExtension(mimeType)
        const imageBuffer = Buffer.from(part.inlineData.data, "base64")
        const fileName = `generated/${jobId}.${fileExtension}`

        const { error: uploadError } = await supabase.storage.from("generated").upload(fileName, imageBuffer, {
          contentType: mimeType,
          upsert: true,
        })

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("generated").getPublicUrl(fileName)
          imageUrl = urlData.publicUrl
        }
      }

      if ((part as any).thoughtSignature) {
        newThoughtSignature = (part as any).thoughtSignature
      }
    }
    
    // Fallback to response.text if available
    if (!responseText && (response as any).text) {
      responseText = (response as any).text.trim()
    }

    const historyWithUser = appendUserTurn(normalizedHistory, prompt, sourceAssetUrl)
    const finalHistory =
      imageUrl && responseText
        ? [
            ...historyWithUser,
            {
              role: "model" as const,
              content: responseText,
              imageUrl,
            },
          ]
        : historyWithUser

    await supabase
      .from("jobs")
      .update({
        status: imageUrl ? "done" : "failed",
        preview_url: imageUrl,
        final_url: imageUrl,
        thought_signature: newThoughtSignature,
        progress_message: imageUrl ? "Complete!" : null,
        error: imageUrl ? null : "Failed to generate image",
        updated_at: new Date().toISOString(),
        conversation_history: finalHistory,
      })
      .eq("job_id", jobId)
  } catch (error: any) {
    console.error("Image generation failed:", error)
    
    // Extract detailed error message
    let errorMessage = "Generation failed"
    if (error?.message) {
      errorMessage = error.message
    } else if (error?.error?.message) {
      errorMessage = error.error.message
    } else if (typeof error === "string") {
      errorMessage = error
    }
    
    // Log full error for debugging
    console.error("Full error details:", JSON.stringify(error, null, 2))
    
    const historyWithUser = appendUserTurn(normalizedHistory, prompt, sourceAssetUrl)
    await supabase
      .from("jobs")
      .update({
        status: "failed",
        error: errorMessage,
        progress_message: null,
        updated_at: new Date().toISOString(),
        conversation_history: historyWithUser,
      })
      .eq("job_id", jobId)
  }
}

type GeminiPart =
  | {
      text: string
    }
  | {
      inlineData: InlineImagePart
    }

type GeminiContent = {
  role: "user" | "model"
  parts: GeminiPart[]
}

type InlineImagePart = {
  mimeType: string
  data: string
}

function selectImageModel() {
  // Use gemini-3-pro-image-preview exclusively per banana3.md
  return "gemini-3-pro-image-preview"
}

function buildGenerationConfig(settings?: GenerationSettings, isHD?: boolean) {
  // Config format per banana3.md for gemini-3-pro-image-preview
  // NO responseModalities - just imageConfig and optional tools
  const config: Record<string, any> = {}

  const aspectRatio = settings?.aspectRatio || "1:1"
  const imageSize = isHD ? "4K" : (settings?.imageSize || "1K")

  // imageConfig is required for aspect ratio and size
  config.imageConfig = {
    aspectRatio,
    imageSize,
  }

  // Google Search grounding tool (optional but recommended per banana3.md)
  if (settings?.useGoogleSearch) {
    config.tools = [{ googleSearch: {} }]
  }

  return config
}

async function buildConversationContents(history: ConversationTurn[]) {
  const contents: GeminiContent[] = []

  for (const turn of history) {
    const parts: GeminiPart[] = []
    if (turn.content) {
      parts.push({ text: turn.content })
    }
    if (turn.imageUrl) {
      const inlineData = await fetchInlineData(turn.imageUrl)
      if (inlineData) {
        parts.push({ inlineData })
      }
    }

    if (parts.length > 0) {
      contents.push({
        role: turn.role,
        parts,
      })
    }
  }

  return contents
}

async function fetchInlineData(url: string, mimeTypeHint?: string): Promise<InlineImagePart | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return null
    }
    const mimeType = mimeTypeHint || response.headers.get("content-type") || guessMimeFromUrl(url)
    const arrayBuffer = await response.arrayBuffer()
    return {
      mimeType,
      data: Buffer.from(arrayBuffer).toString("base64"),
    }
  } catch (error) {
    console.error("Failed to fetch inline data", error)
    return null
  }
}

function guessMimeFromUrl(url: string, fallback = "image/png") {
  const match = url.match(/\.([a-z0-9]+)(?:\?|$)/i)
  if (!match) return fallback
  const ext = match[1].toLowerCase()
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  return fallback
}

function mimeTypeToExtension(mimeType: string) {
  if (mimeType.includes("jpeg")) return "jpg"
  if (mimeType.includes("png")) return "png"
  if (mimeType.includes("webp")) return "webp"
  return "png"
}

function appendUserTurn(history: ConversationTurn[], prompt: string, imageUrl?: string) {
  const userTurn: ConversationTurn = {
    role: "user",
    content: prompt,
    ...(imageUrl ? { imageUrl } : {}),
  }
  return [...history, userTurn]
}
