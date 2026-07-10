// Curated presets inspired by the Paper Shaders project. Each preset stacks one or
// more shader layers (applied in order) with tuned parameter overrides. Picking a
// preset on the landing page seeds the editor with these layers.

import { createLayer, getShader, type ShaderLayer } from "./shaders"

export type PresetLayer = {
  shaderId: string
  // Partial parameter overrides applied on top of the shader's defaults.
  params?: Record<string, number>
}

export type Preset = {
  id: string
  name: string
  description: string
  // Human-readable module list shown on the card ("MODULES USED").
  modules: string[]
  layers: PresetLayer[]
}

export const PRESETS: Preset[] = [
  {
    id: "dynamic",
    name: "Dynamic",
    description: "Punchy contrast with a soft directional blur and fine film grain.",
    modules: ["High Contrast", "Progressive Blur", "Grain"],
    layers: [
      { shaderId: "highContrast", params: { contrast: 1.7, saturation: 1.35, pivot: 0.5 } },
      { shaderId: "progressiveBlur", params: { strength: 4.5, start: 0.45, falloff: 1.6 } },
      { shaderId: "grain", params: { amount: 0.3, size: 1.0 } },
    ],
  },
  {
    id: "spiral",
    name: "Spiral Halftone",
    description: "Halftone dots warped along a slowly rotating spiral lattice.",
    modules: ["Spiral Halftone"],
    layers: [{ shaderId: "spiralHalftone", params: { scale: 26, twist: 7, contrast: 1.35, spin: 0.3 } }],
  },
  {
    id: "grainy-pop",
    name: "Grainy Bright",
    description: "Vivid, saturated colours with chromatic grain for a bold pop.",
    modules: ["Grainy Bright Colours", "Grain"],
    layers: [
      { shaderId: "grainyBright", params: { saturation: 1.9, vibrance: 1.1, brightness: 0.12 } },
      { shaderId: "grain", params: { amount: 0.22 } },
    ],
  },
  {
    id: "retro-tv",
    name: "Retro TV",
    description: "Analog CRT scanlines layered with VHS wobble and colour bleed.",
    modules: ["CRT Scanlines", "VHS"],
    layers: [
      { shaderId: "crt", params: { intensity: 0.65, curvature: 0.28, vignette: 0.5 } },
      { shaderId: "vhs", params: { wobble: 0.5, noise: 0.35, bleed: 0.5 } },
    ],
  },
  {
    id: "halftone-print",
    name: "Halftone Print",
    description: "Newsprint halftone screen over flattened, posterized tones.",
    modules: ["Posterize", "Halftone"],
    layers: [
      { shaderId: "posterize", params: { levels: 5, saturation: 1.1 } },
      { shaderId: "halftone", params: { scale: 90, contrast: 1.3 } },
    ],
  },
  {
    id: "dreamy",
    name: "Dreamy Glow",
    description: "Soft bloom haze with a gentle gradient blur for a dreamy finish.",
    modules: ["Bloom", "Progressive Blur"],
    layers: [
      { shaderId: "bloom", params: { intensity: 0.9, radius: 3.0, threshold: 0.6 } },
      { shaderId: "progressiveBlur", params: { strength: 3.0, start: 0.55 } },
    ],
  },
]

export function getPreset(id: string | null | undefined): Preset | null {
  if (!id) return null
  return PRESETS.find((p) => p.id === id) ?? null
}

// Build editor-ready shader layers from a preset, merging overrides onto defaults.
export function buildLayersFromPreset(preset: Preset): ShaderLayer[] {
  return preset.layers.map((pl) => {
    const layer = createLayer(pl.shaderId)
    if (pl.params) {
      // Only apply overrides for parameters that actually exist on the shader.
      const valid = new Set(getShader(pl.shaderId).params.map((p) => p.key))
      for (const [key, value] of Object.entries(pl.params)) {
        if (valid.has(key)) layer.params[key] = value
      }
    }
    return layer
  })
}
