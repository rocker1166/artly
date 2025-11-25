import { type NextRequest, NextResponse } from "next/server"
import type { ExportPreset } from "@/lib/types"

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, preset } = (await req.json()) as { imageUrl: string; preset: ExportPreset }

    if (!imageUrl || !preset) {
      return NextResponse.json({ error: "Image URL and preset are required" }, { status: 400 })
    }

    // Fetch original image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 })
    }

    const buffer = await response.arrayBuffer()

    // In production, use sharp to resize/convert
    // For now, return original with correct content-type
    const contentType = preset.format === "jpg" ? "image/jpeg" : preset.format === "webp" ? "image/webp" : "image/png"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="creative-studio-${preset.platform}.${preset.format}"`,
      },
    })
  } catch (error) {
    console.error("Export failed:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
