"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, Check, ChevronLeft, ChevronRight, Plus, X, GripVertical } from "lucide-react"
import { SHADERS, getShader, type ShaderLayer } from "@/lib/shaders"

type Props = {
  layers: ShaderLayer[]
  selectedUid: string | null
  onSelectLayer: (uid: string) => void
  onAddLayer: () => void
  onRemoveLayer: (uid: string) => void
  onToggleLayer: (uid: string) => void
  onChangeShader: (uid: string, shaderId: string) => void
  onParamChange: (uid: string, key: string, value: number) => void
  onResetParams: (uid: string) => void
}

// Compact on/off switch used both for layer enable and for boolean shader params.
function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors ${
        on ? "justify-end bg-foreground" : "justify-start bg-secondary"
      }`}
    >
      <span className={`block h-4 w-4 rounded-full transition-colors ${on ? "bg-background" : "bg-muted-foreground"}`} />
    </button>
  )
}

export function ControlsPanel({
  layers,
  selectedUid,
  onSelectLayer,
  onAddLayer,
  onRemoveLayer,
  onToggleLayer,
  onChangeShader,
  onParamChange,
  onResetParams,
}: Props) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const selected = layers.find((l) => l.uid === selectedUid) ?? null
  const activeShader = selected ? getShader(selected.shaderId) : null

  function cycleShader(dir: 1 | -1) {
    if (!selected || !activeShader) return
    const index = SHADERS.findIndex((s) => s.id === activeShader.id)
    const next = (index + dir + SHADERS.length) % SHADERS.length
    onChangeShader(selected.uid, SHADERS[next].id)
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
      {/* Effect stack */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Effects</h2>
          <button
            type="button"
            onClick={onAddLayer}
            className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Plus className="size-3" />
            Add
          </button>
        </div>

        {layers.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            No effects. Add one to start mixing.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {layers.map((layer) => {
              const shader = getShader(layer.shaderId)
              const isSelected = layer.uid === selectedUid
              return (
                <div
                  key={layer.uid}
                  className={`flex items-center gap-2 rounded-md border px-2 py-2 transition-colors ${
                    isSelected ? "border-foreground/30 bg-secondary" : "border-border bg-secondary/30 hover:bg-secondary/60"
                  }`}
                >
                  <GripVertical className="size-3.5 shrink-0 text-muted-foreground/50" />
                  <button
                    type="button"
                    onClick={() => onSelectLayer(layer.uid)}
                    className="flex min-w-0 flex-1 flex-col text-left"
                  >
                    <span className={`truncate text-sm ${layer.enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
                      {shader.name}
                    </span>
                  </button>
                  <Switch on={layer.enabled} onClick={() => onToggleLayer(layer.uid)} label={`Toggle ${shader.name}`} />
                  <button
                    type="button"
                    onClick={() => onRemoveLayer(layer.uid)}
                    aria-label={`Remove ${shader.name}`}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {selected && activeShader && (
        <>
          <div className="h-px w-full bg-border" />

          {/* Shader chooser for the selected layer */}
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Shader</h2>
            <div ref={dropdownRef} className="relative flex items-stretch gap-2">
              <button
                type="button"
                aria-label="Previous shader"
                onClick={() => cycleShader(-1)}
                className="flex w-5 shrink-0 items-center justify-center rounded-md border border-border bg-secondary/40 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>

              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2.5 text-left transition-colors hover:bg-secondary"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">{activeShader.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{activeShader.description}</span>
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>

              <button
                type="button"
                aria-label="Next shader"
                onClick={() => cycleShader(1)}
                className="flex w-5 shrink-0 items-center justify-center rounded-md border border-border bg-secondary/40 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>

              {open && (
                <div
                  role="listbox"
                  className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg"
                >
                  {SHADERS.map((shader) => {
                    const active = shader.id === activeShader.id
                    return (
                      <button
                        key={shader.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          onChangeShader(selected.uid, shader.id)
                          setOpen(false)
                        }}
                        className={`flex w-full items-start gap-2 rounded-sm px-2.5 py-2 text-left transition-colors ${
                          active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        }`}
                      >
                        <Check className={`mt-0.5 size-3.5 shrink-0 ${active ? "opacity-100" : "opacity-0"}`} />
                        <span className="flex flex-col">
                          <span className="text-sm font-medium">{shader.name}</span>
                          <span className="text-xs text-muted-foreground">{shader.description}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          <div className="h-px w-full bg-border" />

          {/* Parameters for the selected layer */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Parameters</h2>
              <button
                type="button"
                onClick={() => onResetParams(selected.uid)}
                className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
              >
                Reset
              </button>
            </div>
            <div className="flex flex-col gap-5">
              {activeShader.params.map((p) => {
                const value = selected.params[p.key] ?? p.default

                if (p.type === "toggle") {
                  const on = value >= 0.5
                  return (
                    <div key={p.key} className="flex items-center justify-between">
                      <label htmlFor={p.key} className="text-sm text-foreground">
                        {p.label}
                      </label>
                      <Switch on={on} onClick={() => onParamChange(selected.uid, p.key, on ? 0 : 1)} label={p.label} />
                    </div>
                  )
                }

                return (
                  <div key={p.key} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor={p.key} className="text-sm text-foreground">
                        {p.label}
                      </label>
                      <span className="font-mono text-xs text-muted-foreground">
                        {value.toFixed(p.step < 0.01 ? 3 : 2)}
                      </span>
                    </div>
                    <input
                      id={p.key}
                      type="range"
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      value={value}
                      onChange={(e) => onParamChange(selected.uid, p.key, Number.parseFloat(e.target.value))}
                      className="slider h-1 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-foreground"
                    />
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
