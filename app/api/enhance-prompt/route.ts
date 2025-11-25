import { type NextRequest, NextResponse } from "next/server"
import { getGeminiClient, STYLE_PROMPTS } from "@/lib/gemini"

export async function POST(req: NextRequest) {
  try {
    const { prompt, style = "photorealistic" } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const ai = getGeminiClient()
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
    const { prompt } = await req.json().catch(() => ({ prompt: "" }))
    return NextResponse.json(
      {
        error: "Failed to enhance prompt",
        enhancedPrompt: prompt || null,
        originalPrompt: prompt,
      },
      { status: 500 },
    )
  }
}
