"use client"

import { useEffect, useState } from "react"
import { PresetCard } from "@/components/preset-card"
import { PRESETS } from "@/lib/presets"
import { DEFAULT_CANVAS, type CanvasSettings, type MediaSource } from "@/lib/renderer"

export function PresetGallery() {
  const [media, setMedia] = useState<MediaSource | null>(null)
  const [settings, setSettings] = useState<CanvasSettings | null>(null)

  // Load the shared default image once; every card reuses the same texture source.
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setMedia({ kind: "image", el: img, width: img.naturalWidth, height: img.naturalHeight })
      setSettings({ width: img.naturalWidth, height: img.naturalHeight, ...DEFAULT_CANVAS })
    }
    img.src = "/default-city.jpg"
  }, [])

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {PRESETS.map((preset) => (
        <PresetCard key={preset.id} preset={preset} media={media} settings={settings} />
      ))}
    </div>
  )
}
