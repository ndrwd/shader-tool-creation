"use client"

import { useCallback, useRef, useState } from "react"
import { Upload, Download, ImageIcon, Video, X } from "lucide-react"
import { ShaderCanvas, type ShaderCanvasHandle } from "@/components/shader-canvas"
import { ControlsPanel } from "@/components/controls-panel"
import { getShader, defaultParams } from "@/lib/shaders"
import type { MediaSource } from "@/lib/renderer"

export default function Page() {
  const [shaderId, setShaderId] = useState("dither")
  const [params, setParams] = useState<Record<string, number>>(() => defaultParams(getShader("dither")))
  const [media, setMedia] = useState<MediaSource | null>(null)
  const [mediaName, setMediaName] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasHandle = useRef<ShaderCanvasHandle>(null)

  const activeShader = getShader(shaderId)

  const handleSelectShader = useCallback((id: string) => {
    setShaderId(id)
    setParams(defaultParams(getShader(id)))
  }, [])

  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleReset = useCallback(() => {
    setParams(defaultParams(activeShader))
  }, [activeShader])

  const loadFile = useCallback((file: File) => {
    setError(null)
    const url = URL.createObjectURL(file)
    setMediaName(file.name)

    if (file.type.startsWith("image/")) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        setMedia({ kind: "image", el: img, width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => setError("Failed to load image")
      img.src = url
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video")
      video.crossOrigin = "anonymous"
      video.loop = true
      video.muted = true
      video.playsInline = true
      video.src = url
      video.onloadeddata = () => {
        video.play().catch(() => {})
        setMedia({ kind: "video", el: video, width: video.videoWidth, height: video.videoHeight })
      }
      video.onerror = () => setError("Failed to load video")
    } else {
      setError("Unsupported file type. Upload an image or video.")
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) loadFile(file)
  }

  const handleDownload = () => {
    const dataUrl = canvasHandle.current?.capture()
    if (!dataUrl) return
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `shader-${shaderId}-${Date.now()}.png`
    a.click()
  }

  const clearMedia = () => {
    setMedia(null)
    setMediaName("")
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <main className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-sm bg-foreground text-background">
            <span className="text-xs font-bold">S</span>
          </div>
          <h1 className="text-sm font-semibold tracking-tight">Shader Lab</h1>
          {mediaName && (
            <span className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              {media?.kind === "video" ? <Video className="size-3" /> : <ImageIcon className="size-3" />}
              <span className="max-w-[180px] truncate">{mediaName}</span>
              <button type="button" onClick={clearMedia} aria-label="Remove media" className="hover:text-foreground">
                <X className="size-3" />
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileInput}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <Upload className="size-3.5" />
            Upload
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!media}
            className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="size-3.5" />
            Export PNG
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Canvas / drop zone */}
        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden p-6"
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <ShaderCanvas
            ref={canvasHandle}
            media={media}
            shaderId={shaderId}
            params={params}
            onError={setError}
          />

          {!media && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`relative z-10 flex flex-col items-center gap-4 rounded-xl border border-dashed px-16 py-14 text-center transition-colors ${
                dragging ? "border-foreground bg-secondary/60" : "border-border hover:border-foreground/40"
              }`}
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
                <Upload className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Drop an image or video</p>
                <p className="mt-1 text-xs text-muted-foreground">or click to browse from your computer</p>
              </div>
            </button>
          )}

          {error && (
            <div className="absolute bottom-4 left-1/2 z-20 max-w-md -translate-x-1/2 rounded-md border border-destructive/50 bg-card px-4 py-2 text-center text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-72 shrink-0 border-l border-border bg-card/40">
          <ControlsPanel
            activeShader={activeShader}
            onSelectShader={handleSelectShader}
            params={params}
            onParamChange={handleParamChange}
            onReset={handleReset}
          />
        </aside>
      </div>
    </main>
  )
}
