"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { ShaderCanvas } from "@/components/shader-canvas"
import { buildLayersFromPreset, type Preset } from "@/lib/presets"
import { type CanvasSettings, type MediaSource } from "@/lib/renderer"
import { useMemo } from "react"

type Props = {
  preset: Preset
  media: MediaSource | null
  settings: CanvasSettings | null
}

export function PresetCard({ preset, media, settings }: Props) {
  // Layers are stable per preset; memoize so the canvas doesn't rebuild each render.
  const layers = useMemo(() => buildLayersFromPreset(preset), [preset])

  return (
    <Link
      href={`/editor?preset=${preset.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/40"
    >
      {/* Live preview */}
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-black">
        <ShaderCanvas media={media} layers={layers} settings={settings} bgImage={null} onError={() => {}} />
        {!media && <div className="absolute inset-0 animate-pulse bg-secondary/30" />}
        <div className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wide">{preset.name}</h3>
          <p className="mt-1 text-pretty text-xs leading-relaxed text-muted-foreground">{preset.description}</p>
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5">
          {preset.modules.map((m) => (
            <span
              key={m}
              className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
