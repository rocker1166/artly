"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { Job } from "@/lib/types"

interface ExampleImagesProps {
  jobs: Job[]
}

export function ExampleImages({ jobs }: ExampleImagesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<Job | null>(null)

  const handleCopyPrompt = async (job: Job, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    if (!job.originalPrompt) return
    
    try {
      await navigator.clipboard.writeText(job.originalPrompt)
      setCopiedId(job.jobId)
      toast.success("Prompt copied to clipboard!")
      
      setTimeout(() => {
        setCopiedId(null)
      }, 2000)
    } catch (error) {
      toast.error("Failed to copy prompt")
    }
  }

  const handleImageClick = (job: Job) => {
    setSelectedImage(job)
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <ImageIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground/90 mb-2">No images yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Generated images will appear here. Start creating to build your gallery!
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {jobs.map((job) => (
          <div
            key={job.jobId}
            onClick={() => handleImageClick(job)}
            className="group relative rounded-xl overflow-hidden border border-white/8 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:scale-[1.02] cursor-pointer"
          >
            {/* Image */}
            {job.previewUrl ? (
              <img
                src={job.previewUrl}
                alt={job.originalPrompt || "Generated image"}
                className="w-full aspect-[4/3] object-cover"
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-white/5 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-4">
              {/* Action buttons - icon only */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleImageClick(job)
                  }}
                  className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/25 hover:scale-105 transition-all"
                  title="View full size"
                >
                  <ExpandIcon className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => handleCopyPrompt(job, e)}
                  className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/25 hover:scale-105 transition-all"
                  title="Copy prompt to clipboard"
                >
                  {copiedId === job.jobId ? (
                    <CheckIcon className="w-4 h-4 text-white" />
                  ) : (
                    <CopyIcon className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Status badge */}
            {job.status === "failed" && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs bg-red-500/80 backdrop-blur-sm text-white font-medium">
                Failed
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Full-screen image viewer */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0 bg-black/95 border-white/10">
          {selectedImage && (
            <>
              {/* Accessible title for screen readers */}
              <DialogTitle className="sr-only">
                Full size view: {selectedImage.originalPrompt}
              </DialogTitle>
              
              <div className="flex flex-col">
                {/* Image */}
                <div className="flex items-center justify-center p-8">
                  <img
                    src={selectedImage.previewUrl || selectedImage.finalUrl || ""}
                    alt={selectedImage.originalPrompt || "Generated image"}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                </div>

                {/* Prompt and actions */}
                <div className="p-6 bg-gradient-to-t from-black/80 to-transparent border-t border-white/10">
                  <div className="max-w-3xl mx-auto space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Prompt</h3>
                      <p className="text-base text-white/95 leading-relaxed">
                        {selectedImage.originalPrompt}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyPrompt(selectedImage)}
                      className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[oklch(0.65_0.22_290)] to-[oklch(0.72_0.18_195)] hover:opacity-90 transition-all flex items-center justify-center gap-2 text-white font-semibold"
                    >
                      {copiedId === selectedImage.jobId ? (
                        <>
                          <CheckIcon className="w-5 h-5" />
                          Prompt Copied!
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-5 h-5" />
                          Copy Prompt to Clipboard
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  )
}
