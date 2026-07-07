"use client"

import { SHADERS, type ShaderDef } from "@/lib/shaders"

type Props = {
  activeShader: ShaderDef
  onSelectShader: (id: string) => void
  params: Record<string, number>
  onParamChange: (key: string, value: number) => void
  onReset: () => void
}

export function ControlsPanel({
  activeShader,
  onSelectShader,
  params,
  onParamChange,
  onReset,
}: Props) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Shader</h2>
        <div className="flex flex-col gap-1">
          {SHADERS.map((shader) => {
            const active = shader.id === activeShader.id
            return (
              <button
                key={shader.id}
                type="button"
                onClick={() => onSelectShader(shader.id)}
                className={`flex flex-col rounded-md border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "border-foreground/30 bg-secondary text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <span className="text-sm font-medium">{shader.name}</span>
                <span className="text-xs text-muted-foreground">{shader.description}</span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="h-px w-full bg-border" />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Parameters</h2>
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            Reset
          </button>
        </div>
        <div className="flex flex-col gap-5">
          {activeShader.params.map((p) => {
            const value = params[p.key] ?? p.default

            if (p.type === "toggle") {
              const on = value >= 0.5
              return (
                <div key={p.key} className="flex items-center justify-between">
                  <label htmlFor={p.key} className="text-sm text-foreground">
                    {p.label}
                  </label>
                  <button
                    id={p.key}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => onParamChange(p.key, on ? 0 : 1)}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      on ? "bg-foreground" : "bg-secondary"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full transition-transform ${
                        on ? "translate-x-4 bg-background" : "translate-x-0.5 bg-muted-foreground"
                      }`}
                    />
                  </button>
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
                  onChange={(e) => onParamChange(p.key, Number.parseFloat(e.target.value))}
                  className="slider h-1 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-foreground"
                />
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
