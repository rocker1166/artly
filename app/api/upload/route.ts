import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const deviceId = formData.get("deviceId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const assetId = uuidv4()
    const fileExt = file.name.split(".").pop()
    const fileName = `${assetId}.${fileExt}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage.from("assets").upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("assets").getPublicUrl(fileName)

    // Get image dimensions (basic approach - you might want to use sharp for better handling)
    const width = 1024 // Placeholder - would need image processing to get actual dimensions
    const height = 1024

    // Save asset record to database
    const { error: dbError } = await supabase.from("assets").insert({
      asset_id: assetId,
      device_id: deviceId || "unknown",
      url: urlData.publicUrl,
      thumb_url: urlData.publicUrl, // Could generate thumbnail
      width,
      height,
      mime_type: file.type,
    })

    if (dbError) {
      console.error("DB error:", dbError)
    }

    return NextResponse.json({
      assetId,
      url: urlData.publicUrl,
      thumbUrl: urlData.publicUrl,
      width,
      height,
      mimeType: file.type,
    })
  } catch (error) {
    console.error("Upload failed:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
