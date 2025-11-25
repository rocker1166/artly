"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Job, ExportPreset } from "@/lib/types"
import { EXPORT_PRESETS } from "@/lib/types"

interface ExportFooterProps {
  job: Job | null
}

export function ExportFooter({ job }: ExportFooterProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("original")
  const [isExporting, setIsExporting] = useState(false)
  const [copied, setCopied] = useState(false)

  const canExport = job?.status === "done" && job?.finalUrl

  const handleDownload = async (preset?: ExportPreset) => {
    if (!job?.finalUrl) return

    setIsExporting(true)
    try {
      // If a preset is selected, process through API
      if (preset && selectedPreset !== "original") {
        const res = await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: job.finalUrl,
            preset: preset,
          }),
        })
        const blob = await res.blob()
        downloadBlob(blob, `creative-studio-${preset.platform}.${preset.format}`)
      } else {
        // Direct download
        const response = await fetch(job.finalUrl)
        const blob = await response.blob()
        const format = job.settings?.outputFormat || "png"
        downloadBlob(blob, `creative-studio-${job.jobId}.${format}`)
      }
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Download failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Image downloaded!")
  }

  const handleCopyLink = async () => {
    if (!job?.finalUrl) return
    await navigator.clipboard.writeText(job.finalUrl)
    setCopied(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const currentPreset = EXPORT_PRESETS.find((p) => p.name === selectedPreset)

  return (
    <footer className="glass-panel m-4 mt-0 p-4 flex items-center justify-between flex-wrap gap-4">
      {/* Info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Powered by Gemini 3 Pro</span>
        {job && (
          <>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span>
              {job.settings?.imageSize || "1K"} • {job.settings?.aspectRatio || "1:1"} •{" "}
              {job.settings?.outputFormat?.toUpperCase() || "PNG"}
            </span>
          </>
        )}
      </div>

      {/* Export controls */}
      <div className="flex items-center gap-3">
        {/* Export Preset Selector */}
        <Select value={selectedPreset} onValueChange={setSelectedPreset}>
          <SelectTrigger className="w-[180px] h-9 text-xs bg-background/50 border-white/10">
            <SelectValue placeholder="Export format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">Original</SelectItem>
            {EXPORT_PRESETS.map((preset) => (
              <SelectItem key={preset.name} value={preset.name}>
                <span className="flex items-center gap-2">
                  <PlatformIcon platform={preset.platform} className="w-3 h-3" />
                  {preset.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Quick export buttons */}
        <div className="hidden sm:flex gap-1">
          {EXPORT_PRESETS.slice(0, 3).map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleDownload(preset)}
              disabled={!canExport || isExporting}
              className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 transition-all"
              title={preset.name}
            >
              <PlatformIcon platform={preset.platform} className="w-4 h-4" />
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={!canExport}
          onClick={handleCopyLink}
          className="border-white/10 hover:bg-white/5 bg-transparent"
        >
          {copied ? <CheckIcon className="w-4 h-4 mr-2 text-emerald-400" /> : <LinkIcon className="w-4 h-4 mr-2" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>

        <Button
          size="sm"
          disabled={!canExport || isExporting}
          onClick={() => handleDownload(currentPreset)}
          className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white border-0"
        >
          {isExporting ? (
            <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <DownloadIcon className="w-4 h-4 mr-2" />
          )}
          Download
        </Button>
      </div>
    </footer>
  )
}

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    linkedin: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
    twitter: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    youtube: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    presentation: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  }
  return <>{icons[platform] || null}</>
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
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

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )
}
