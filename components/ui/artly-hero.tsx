"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { gsap } from "gsap"
import { WebGLShader } from "./web-gl-shader"
import { LiquidButton } from "./liquid-glass-button"

interface ArtlyHeroProps {
  onEnter: () => void
}

export function ArtlyHero({ onEnter }: ArtlyHeroProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200)
    return () => clearTimeout(timer)
  }, [])

  const handleEnter = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)

    if (heroRef.current && cardRef.current) {
      const tl = gsap.timeline({ onComplete: () => onEnter() })
      tl.to(cardRef.current, { opacity: 0, y: -40, duration: 0.5, ease: "power2.in" })
      tl.to(heroRef.current, { y: "-100%", duration: 0.8, ease: "power3.inOut" }, "-=0.1")
    } else {
      onEnter()
    }
  }, [isExiting, onEnter])

  useEffect(() => {
    const handleKey = (evt: KeyboardEvent) => {
      if (evt.key === "Enter" && !isExiting) {
        handleEnter()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleEnter, isExiting])

  return (
    <div ref={heroRef} className="fixed inset-0 z-50 overflow-hidden bg-black">
      <WebGLShader />
      <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/40 to-black/90" />

      <div className="relative z-10 flex h-full items-center justify-center px-4 py-12 md:px-8">
        <div
          ref={cardRef}
          className={`w-full max-w-4xl rounded-[32px] border border-white/10 bg-white/10/70 p-8 text-center backdrop-blur-2xl shadow-[0_25px_120px_rgba(0,0,0,0.65)] transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <main className="relative z-10 space-y-8 py-12 px-6 text-white md:px-12">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.45em] text-white/40">Artly Studio</p>
              <h1 className="text-4xl font-black leading-tight tracking-tight md:text-[clamp(3rem,8vw,6rem)]">
                <span className="block text-white drop-shadow-[0_5px_30px_rgba(0,0,0,0.4)]">Artly</span>
                <span className="block text-white/90">Image Everything</span>
              </h1>
              <p className="mx-auto max-w-2xl text-sm text-white/70 md:text-lg">
                Artly is your AI image lab—generate bold concepts, restyle catalog shots, and orchestrate entire
                creative workflows in one glassy workspace powered by Gemini 3 Pro.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-emerald-300 drop-shadow">
              <span className="relative flex h-3 w-3 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Accepting new image missions
            </div>

            <div className="flex justify-center">
              <LiquidButton className="border border-white/15" size="xl" onClick={handleEnter} disabled={isExiting}>
                Launch Studio
              </LiquidButton>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default ArtlyHero

