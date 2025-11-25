"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExampleImages } from "./example-images"
import type { Job } from "@/lib/types"

interface PromptGalleryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceId: string
}

export function PromptGalleryModal({ open, onOpenChange, deviceId }: PromptGalleryModalProps) {
  // Static dummy images for demonstration - customize these prompts and URLs as needed
  const dummyImages: Job[] = [
    {
      jobId: "demo-1",
      deviceId: "demo",
      status: "done",
      originalPrompt: "A futuristic cityscape at sunset with flying cars and neon lights, cyberpunk style, highly detailed",
      previewUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      jobId: "demo-2",
      deviceId: "demo",
      status: "done",
      originalPrompt: " Generate a 9:16 aspect ratio hand-drawn portrait illustration in red and yellow pen on notebook paper, inspired by doodle art and comic annotations.Keep full likeness of the subject, expressive linesspontaneous gestures, bold outline glow, handwrittennotes around, realistic pen stroke textures, 4k resolution.",
      previewUrl: "https://jiptsqgmzkhddiamqtsf.supabase.co/storage/v1/object/public/generated/generated/db0aa4cc-7aac-4503-bb57-56cf30ab75f6.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      jobId: "demo-3",
      deviceId: "demo",
      status: "done",
      originalPrompt: "Abstract geometric patterns in vibrant colors, modern art style, symmetrical design",
      previewUrl: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&h=600&fit=crop",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      jobId: "demo-4",
      deviceId: "demo",
      status: "done",
      originalPrompt: "A cozy coffee shop interior with warm lighting, books on shelves, and a steaming cup of coffee",
      previewUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      jobId: "demo-5",
      deviceId: "demo",
      status: "done",
      originalPrompt: "A majestic lion portrait with detailed fur, intense gaze, dramatic lighting, wildlife photography",
      previewUrl: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&h=600&fit=crop",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      jobId: "demo-6",
      deviceId: "demo",
      status: "done",
      originalPrompt: "A vibrant bouquet of colorful flowers in a glass vase, soft natural lighting, macro photography",
      previewUrl: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=600&fit=crop",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden glass-panel border-white/10 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[oklch(0.65_0.22_290)] to-[oklch(0.72_0.18_195)] flex items-center justify-center">
              <GalleryIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-display font-bold tracking-tight text-white">
                Prompt Gallery
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {dummyImages.length} example image{dummyImages.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <ExampleImages jobs={dummyImages} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function GalleryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  )
}
