import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Fetch image from URL
    const response = await fetch(url)
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image from URL" }, { status: 400 })
    }

    const contentType = response.headers.get("content-type") || "image/png"
    const buffer = await response.arrayBuffer()

    const supabase = createServerSupabaseClient()
    const assetId = uuidv4()
    const ext = contentType.split("/")[1] || "png"
    const fileName = `assets/${assetId}.${ext}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.from("assets").upload(fileName, Buffer.from(buffer), {
      contentType,
      upsert: true,
    })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from("assets").getPublicUrl(fileName)

    // Get image dimensions (simplified - in production use sharp)
    const width = 1024
    const height = 1024

    // Save asset record
    await supabase.from("assets").insert({
      asset_id: assetId,
      device_id: "url-upload",
      url: urlData.publicUrl,
      width,
      height,
      mime_type: contentType,
    })

    return NextResponse.json({
      assetId,
      url: urlData.publicUrl,
      width,
      height,
      mimeType: contentType,
    })
  } catch (error) {
    console.error("URL upload failed:", error)
    return NextResponse.json({ error: "Failed to process URL" }, { status: 500 })
  }
}
