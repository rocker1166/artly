import { type NextRequest, NextResponse } from "next/server"
import { getGeminiClient, STYLE_PROMPTS } from "@/lib/gemini"

type EnhancePayload = {
  prompt?: string
  style?: string
  apiKeyOverride?: string
}

export async function POST(req: NextRequest) {
  let payload: EnhancePayload | undefined
  try {
    payload = await req.json()
    const { prompt, style = "photorealistic", apiKeyOverride } = payload

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const override = typeof apiKeyOverride === "string" ? apiKeyOverride.trim() : undefined
    const ai = getGeminiClient(override)
    const systemPrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.photorealistic

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `${systemPrompt}\n\nUser prompt: ${prompt}`,
      config: {
        responseModalities: ["TEXT"],
      },
    })

    const enhancedPrompt = response.text?.trim() || prompt

    return NextResponse.json({
      enhancedPrompt,
      originalPrompt: prompt,
    })
  } catch (error) {
    console.error("Prompt enhancement failed:", error)
    const failedPrompt = payload?.prompt ?? ""
    return NextResponse.json(
      {
        error: "Failed to enhance prompt",
        enhancedPrompt: failedPrompt || null,
        originalPrompt: failedPrompt,
      },
      { status: 500 },
    )
  }
}
