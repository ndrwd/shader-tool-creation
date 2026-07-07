"use client"

import { useEffect, useRef, useState } from "react"
import { ImageIcon, Video, ChevronDown, RotateCcw, Plus, Minus } from "lucide-react"
import type { CanvasSettings } from "@/lib/renderer"

type Props = {
  mediaKind: "image" | "video" | null
  previewUrl: string | null
  originalSize: { width: number; height: number } | null
  settings: CanvasSettings | null
  onChange: (patch: Partial<CanvasSettings>) => void
  onReset: () => void
  onPickMedia: (type: "image" | "video") => void
  bgPreviewUrl: string | null
  onPickBgImage: () => void
}

function toHex(c: [number, number, number]) {
  return (
    "#" +
    c
      .map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0"))
      .join("")
  )
}

function fromHex(hex: string): [number, number, number] {
  const n = hex.replace("#", "")
  return [
    Number.parseInt(n.slice(0, 2), 16) / 255,
    Number.parseInt(n.slice(2, 4), 16) / 255,
    Number.parseInt(n.slice(4, 6), 16) / 255,
  ]
}

const BG_MODES: { id: 0 | 1 | 2; label: string }[] = [
  { id: 0, label: "None" },
  { id: 1, label: "Color" },
  { id: 2, label: "Image" },
]

export function MediaPanel({
  mediaKind,
  previewUrl,
  originalSize,
  settings,
  onChange,
  onReset,
  onPickMedia,
  bgPreviewUrl,
  onPickBgImage,
}: Props) {
  const [expanded, setExpanded] = useState(true)
  const padRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  // Local editable strings so the number fields can be cleared/typed freely
  const [widthStr, setWidthStr] = useState("")
  const [heightStr, setHeightStr] = useState("")

  useEffect(() => {
    if (settings) setWidthStr(String(Math.round(settings.width)))
  }, [settings?.width])
  useEffect(() => {
    if (settings) setHeightStr(String(Math.round(settings.height)))
  }, [settings?.height])

  const activeTab = mediaKind ?? "image"

  function commitSize(key: "width" | "height", raw: string) {
    const n = Number.parseInt(raw, 10)
    if (Number.isFinite(n) && n >= 1) onChange({ [key]: n } as Partial<CanvasSettings>)
  }

  function handlePad(e: React.PointerEvent) {
    if (!padRef.current || !settings) return
    const rect = padRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width // 0..1
    const y = (e.clientY - rect.top) / rect.height // 0..1
    const offsetX = Math.max(-1, Math.min(1, x * 2 - 1))
    const offsetY = Math.max(-1, Math.min(1, (1 - y) * 2 - 1))
    onChange({ offsetX, offsetY })
  }

  const handleX = settings ? (settings.offsetX * 0.5 + 0.5) * 100 : 50
  const handleY = settings ? (0.5 - settings.offsetY * 0.5) * 100 : 50

  return (
    <section className="border-b border-border p-4">
      {/* Media type tabs */}
      <div className="flex items-start gap-3">
        <div className="flex flex-1 rounded-lg bg-secondary/50 p-1">
          <button
            type="button"
            onClick={() => onPickMedia("image")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "image" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ImageIcon className="size-4" />
            Image
          </button>
          <button
            type="button"
            onClick={() => onPickMedia("video")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "video" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="size-4" />
            Video
          </button>
        </div>

        {/* Thumbnail */}
        <div className="size-11 shrink-0 overflow-hidden rounded-md border border-border bg-secondary/40">
          {previewUrl && mediaKind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl || "/placeholder.svg"} alt="Current media preview" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              {mediaKind === "video" ? <Video className="size-5" /> : <ImageIcon className="size-5" />}
            </div>
          )}
        </div>
      </div>

      <p className="mt-2 text-center text-xs italic text-muted-foreground">Cmd/Ctrl+V to paste another image</p>

      <div className="my-2.5 h-px bg-border" />

      {/* Canvas settings header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-foreground"
        >
          Canvas Settings
          <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Restore Default
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      {expanded && settings && (
        <div className="mt-4 flex flex-col gap-4">
          {/* Size + Position row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Size */}
            <div>
              <h3 className="mb-1 text-sm font-medium text-foreground">Size</h3>
              <p className="mb-2 text-xs text-muted-foreground">
                original: {originalSize ? `${originalSize.width}×${originalSize.height}` : "—"}
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={widthStr}
                  onChange={(e) => {
                    setWidthStr(e.target.value)
                    commitSize("width", e.target.value)
                  }}
                  onBlur={() => setWidthStr(String(Math.round(settings.width)))}
                  className="w-full min-w-0 rounded-md border border-border bg-secondary/40 px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground/40"
                />
                <span className="text-xs text-muted-foreground">x</span>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={heightStr}
                  onChange={(e) => {
                    setHeightStr(e.target.value)
                    commitSize("height", e.target.value)
                  }}
                  onBlur={() => setHeightStr(String(Math.round(settings.height)))}
                  className="w-full min-w-0 rounded-md border border-border bg-secondary/40 px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground/40"
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-foreground">Position</h3>
              <div className="flex items-stretch gap-2">
                <div
                  ref={padRef}
                  onPointerDown={(e) => {
                    dragging.current = true
                    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
                    handlePad(e)
                  }}
                  onPointerMove={(e) => dragging.current && handlePad(e)}
                  onPointerUp={() => (dragging.current = false)}
                  className="relative aspect-square w-full min-w-0 max-w-24 cursor-crosshair self-start rounded-md border border-border bg-secondary/30"
                >
                  {/* crosshair guides */}
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                  <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
                  <div
                    className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-md border border-foreground/40 bg-foreground/20"
                    style={{ left: `${handleX}%`, top: `${handleY}%` }}
                  />
                </div>

                {/* Zoom */}
                <div className="flex w-7 flex-col items-center gap-1.5 rounded-md border border-border bg-secondary/30 py-1.5">
                  <button
                    type="button"
                    aria-label="Zoom in"
                    onClick={() => onChange({ zoom: Math.min(4, settings.zoom + 0.1) })}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Plus className="size-3.5" />
                  </button>
                  <input
                    type="range"
                    min={0.2}
                    max={4}
                    step={0.02}
                    value={settings.zoom}
                    onChange={(e) => onChange({ zoom: Number.parseFloat(e.target.value) })}
                    aria-label="Zoom"
                    className="slider-vertical h-full cursor-pointer accent-foreground"
                    style={{ writingMode: "vertical-lr", direction: "rtl", width: "6px" }}
                  />
                  <button
                    type="button"
                    aria-label="Zoom out"
                    onClick={() => onChange({ zoom: Math.max(0.2, settings.zoom - 0.1) })}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Minus className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas background */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-foreground">Canvas background</h3>
            <div className="flex rounded-lg bg-secondary/50 p-1">
              {BG_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onChange({ bgMode: mode.id })}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    settings.bgMode === mode.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {settings.bgMode === 1 && (
              <label className="mt-3 flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2">
                <span className="text-sm text-foreground">Color</span>
                <input
                  type="color"
                  value={toHex(settings.bgColor)}
                  onChange={(e) => onChange({ bgColor: fromHex(e.target.value) })}
                  className="size-7 cursor-pointer rounded border border-border bg-transparent"
                />
              </label>
            )}

            {settings.bgMode === 2 && (
              <button
                type="button"
                onClick={onPickBgImage}
                className="mt-3 flex w-full items-center gap-3 rounded-md border border-border bg-secondary/40 px-3 py-2 text-left transition-colors hover:bg-secondary"
              >
                <div className="size-9 shrink-0 overflow-hidden rounded border border-border bg-secondary">
                  {bgPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bgPreviewUrl || "/placeholder.svg"} alt="Background" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-4" />
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{bgPreviewUrl ? "Change image" : "Choose image"}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
