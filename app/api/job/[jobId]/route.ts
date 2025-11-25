import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params
    const supabase = createServerSupabaseClient()

    const { data: job, error } = await supabase.from("jobs").select("*").eq("job_id", jobId).single()

    if (error || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({
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
      progressMessage: job.progress_message,
      error: job.error,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    })
  } catch (error) {
    console.error("Job fetch failed:", error)
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 })
  }
}
