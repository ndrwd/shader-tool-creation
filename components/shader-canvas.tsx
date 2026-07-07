"use client"

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react"
import { ShaderRenderer, type MediaSource } from "@/lib/renderer"
import { getShader } from "@/lib/shaders"

export type ShaderCanvasHandle = {
  capture: () => string | null
}

type Props = {
  media: MediaSource | null
  shaderId: string
  params: Record<string, number>
  onError: (message: string | null) => void
}

export const ShaderCanvas = forwardRef<ShaderCanvasHandle, Props>(function ShaderCanvas(
  { media, shaderId, params, onError },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<ShaderRenderer | null>(null)

  useImperativeHandle(ref, () => ({
    capture: () => rendererRef.current?.capture() ?? null,
  }))

  // Initialize renderer once.
  useEffect(() => {
    if (!canvasRef.current) return
    try {
      const renderer = new ShaderRenderer(canvasRef.current)
      rendererRef.current = renderer
      renderer.start()
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to initialize WebGL")
    }
    return () => {
      rendererRef.current?.dispose()
      rendererRef.current = null
    }
  }, [onError])

  // Update media.
  useEffect(() => {
    if (!rendererRef.current || !media) return
    rendererRef.current.setMedia(media)
  }, [media])

  // Update shader program.
  useEffect(() => {
    if (!rendererRef.current) return
    try {
      rendererRef.current.setShader(getShader(shaderId))
      onError(null)
    } catch (e) {
      onError(e instanceof Error ? e.message : "Shader error")
    }
  }, [shaderId, onError])

  // Update params.
  useEffect(() => {
    rendererRef.current?.setParams(params)
  }, [params])

  return (
    <canvas
      ref={canvasRef}
      className="max-h-full max-w-full rounded-lg object-contain"
      style={{ display: media ? "block" : "none" }}
    />
  )
})
