'use client'

import { useState } from "react"
import { CreativeStudio } from "@/components/creative-studio/creative-studio"
import { ArtlyHero } from "@/components/ui/artly-hero"

export default function DemoOne() {
  const [showHero, setShowHero] = useState(true)

  return (
    <>
      <div className={`transition-opacity duration-500 ${showHero ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        <CreativeStudio />
      </div>
      {showHero && <ArtlyHero onEnter={() => setShowHero(false)} />}
    </>
  )
}