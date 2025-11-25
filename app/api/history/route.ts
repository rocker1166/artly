import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get("deviceId")

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("History fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
    }

    return NextResponse.json({
      jobs: jobs.map((job) => ({
        jobId: job.job_id,
        deviceId: job.device_id,
        status: job.status,
        originalPrompt: job.original_prompt,
        enhancedPrompt: job.enhanced_prompt,
        previewUrl: job.preview_url,
        finalUrl: job.final_url,
        assetId: job.asset_id,
        settings: job.settings,
        thoughtSignature: job.thought_signature,
        conversationHistory: job.conversation_history,
        error: job.error,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      })),
    })
  } catch (error) {
    console.error("History fetch failed:", error)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}
