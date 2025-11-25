import { type NextRequest, NextResponse } from "next/server"
import { getGeminiClient } from "@/lib/gemini"

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json()
    const trimmedKey = typeof apiKey === "string" ? apiKey.trim() : ""

    if (!trimmedKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    const ai = getGeminiClient(trimmedKey)
    await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "ping",
      config: {
        responseModalities: ["TEXT"],
        maxOutputTokens: 1,
      },
    })

    return NextResponse.json({ valid: true })
  } catch (error: any) {
    const message = error?.message || "Unable to validate key"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

