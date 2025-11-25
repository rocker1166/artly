'use client'

import { useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ClipboardIcon } from "lucide-react"
import { toast } from "sonner"

type PromptExample = {
  title: string
  description: string
  prompt: string
  image: string
}

const EXAMPLES: PromptExample[] = [
  {
    title: "Neon Portrait",
    description: "Cyberpunk-inspired portrait bathed in electric blue and magenta lighting.",
    prompt:
      "Create a cinematic cyberpunk portrait of a young woman in a rain-soaked alley. Neon signage reflects on her face, glowing magenta and cyan. Add subtle holographic UI elements floating around her, soft bokeh in the background, and a sense of mystery.",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Futurist Interior",
    description: "Luxury living room with floating furniture and panoramic skyline views.",
    prompt:
      "Design a high-end penthouse living room with curved glass walls overlooking a futuristic skyline at dusk. Floating modular furniture, warm indirect lighting, sculptural plants, and a translucent waterfall room divider.",
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Architectural Concept",
    description: "Organic museum pavilion inspired by coral reefs and desert dunes.",
    prompt:
      "Illustrate a biomimetic cultural center nestled in a desert landscape. The structure should mimic coral formations with perforated terracotta panels, dappled shadows, and a water courtyard for passive cooling.",
    image:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Editorial Still Life",
    description: "Monochrome table-top scene with dramatic noon shadows.",
    prompt:
      "Compose a high-contrast editorial still life on a marble tabletop. Include a vintage camera, open notebook, hand-thrown ceramic mug, and a single tulip. Light from a skylight to cast crisp geometric shadows.",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Organic Product Shot",
    description: "Skincare bottle surrounded by botanicals and soft vapor.",
    prompt:
      "Photograph a minimalist skincare serum bottle on a reflective stone slab. Surround it with dew-kissed eucalyptus leaves, soft morning mist, and a gentle backlight creating a halo effect.",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Illustrated Travel Poster",
    description: "Retro airline poster for a tropical island escape.",
    prompt:
      "Create a mid-century travel poster for a fictional island named 'Luma Atoll'. Use saturated oranges and teals, include seaplanes, art deco typography, and stylized palm silhouettes at sunset.",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  },
]

type PromptGalleryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PromptGalleryDialog({ open, onOpenChange }: PromptGalleryDialogProps) {
  const examples = useMemo(() => EXAMPLES, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border border-white/10 bg-black/80 p-0 text-white">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-semibold">Prompt Gallery</DialogTitle>
          <DialogDescription className="text-sm text-white/70">
            Swipe through ready-to-use art directions. Hover any tile to preview the full system prompt and copy with one
            click.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {examples.map((example) => (
              <div
                key={example.title}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl"
              >
                <div className="aspect-video overflow-hidden">
                  <img src={example.image} alt={example.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-4 space-y-1">
                  <p className font-semibold text-white>{example.title}</p>
                  <p className="text-sm text-white/70">{example.description}</p>
                </div>
                <div className="absolute inset-0 bg-black/80 opacity-0 transition-opacity group hover:opacity-100 flex flex-col justify-between p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">System prompt</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/90 whitespace-pre-line">{example.prompt}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="self-start gap-2"
                    onClick={() => {
                      navigator?.clipboard?.writeText(example.prompt)
                      toast.success("Prompt copied to clipboard")
                    }}
                  >
                    <ClipboardIcon className="h-4 w-4" />
                    Copy prompt
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

