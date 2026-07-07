// Shader definitions inspired by the Paper Shaders project (paper-design/shaders).
// Each shader is a WebGL fragment shader that samples the uploaded media (u_texture)
// and applies a distinct visual effect controlled by a set of parameters.

export type ShaderParam = {
  key: string
  label: string
  min: number
  max: number
  step: number
  default: number
}

export type ShaderDef = {
  id: string
  name: string
  description: string
  fragment: string
  params: ShaderParam[]
}

// Shared vertex shader — draws a full-screen quad and passes UV coordinates.
export const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const HEADER = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
`

export const SHADERS: ShaderDef[] = [
  {
    id: "dither",
    name: "Dithering",
    description: "Ordered Bayer dithering with adjustable levels",
    params: [
      { key: "pixelSize", label: "Pixel Size", min: 1, max: 16, step: 1, default: 3 },
      { key: "levels", label: "Color Levels", min: 2, max: 8, step: 1, default: 3 },
      { key: "contrast", label: "Contrast", min: 0.5, max: 2.5, step: 0.05, default: 1.2 },
    ],
    fragment: `${HEADER}
uniform float u_pixelSize;
uniform float u_levels;
uniform float u_contrast;

float bayer4(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int index = x + y * 4;
  float m[16];
  m[0]=0.0;  m[1]=8.0;  m[2]=2.0;  m[3]=10.0;
  m[4]=12.0; m[5]=4.0;  m[6]=14.0; m[7]=6.0;
  m[8]=3.0;  m[9]=11.0; m[10]=1.0; m[11]=9.0;
  m[12]=15.0;m[13]=7.0; m[14]=13.0;m[15]=5.0;
  float v = 0.0;
  for (int i = 0; i < 16; i++) { if (i == index) v = m[i]; }
  return (v + 0.5) / 16.0;
}

void main() {
  vec2 px = u_pixelSize / u_resolution;
  vec2 uv = px * floor(v_uv / px);
  vec3 color = texture2D(u_texture, uv).rgb;
  color = (color - 0.5) * u_contrast + 0.5;
  float threshold = bayer4(gl_FragCoord.xy / u_pixelSize);
  vec3 dithered = color + (threshold - 0.5) / u_levels;
  vec3 quantized = floor(dithered * (u_levels - 1.0) + 0.5) / (u_levels - 1.0);
  gl_FragColor = vec4(clamp(quantized, 0.0, 1.0), 1.0);
}
`,
  },
  {
    id: "rgbShift",
    name: "RGB Shift",
    description: "Chromatic aberration that splits color channels",
    params: [
      { key: "amount", label: "Amount", min: 0, max: 0.05, step: 0.001, default: 0.012 },
      { key: "angle", label: "Angle", min: 0, max: 6.28, step: 0.01, default: 0.0 },
      { key: "animate", label: "Animate", min: 0, max: 1, step: 1, default: 0 },
    ],
    fragment: `${HEADER}
uniform float u_amount;
uniform float u_angle;
uniform float u_animate;

void main() {
  float a = u_angle + u_animate * u_time * 0.6;
  vec2 dir = vec2(cos(a), sin(a)) * u_amount;
  float r = texture2D(u_texture, v_uv + dir).r;
  float g = texture2D(u_texture, v_uv).g;
  float b = texture2D(u_texture, v_uv - dir).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}
`,
  },
  {
    id: "pixelate",
    name: "Pixelate",
    description: "Mosaic block pixelation",
    params: [
      { key: "size", label: "Block Size", min: 2, max: 80, step: 1, default: 16 },
      { key: "gap", label: "Gap", min: 0, max: 0.5, step: 0.01, default: 0.0 },
    ],
    fragment: `${HEADER}
uniform float u_size;
uniform float u_gap;

void main() {
  vec2 blocks = u_resolution / u_size;
  vec2 cell = floor(v_uv * blocks);
  vec2 uv = (cell + 0.5) / blocks;
  vec3 color = texture2D(u_texture, uv).rgb;
  vec2 f = fract(v_uv * blocks);
  float edge = step(u_gap, f.x) * step(u_gap, f.y) * step(u_gap, 1.0 - f.x) * step(u_gap, 1.0 - f.y);
  gl_FragColor = vec4(color * edge, 1.0);
}
`,
  },
  {
    id: "crt",
    name: "CRT Scanlines",
    description: "Retro CRT scanlines with vignette and curvature",
    params: [
      { key: "scanCount", label: "Scanlines", min: 100, max: 1200, step: 10, default: 500 },
      { key: "intensity", label: "Intensity", min: 0, max: 1, step: 0.02, default: 0.4 },
      { key: "curvature", label: "Curvature", min: 0, max: 0.4, step: 0.01, default: 0.12 },
      { key: "vignette", label: "Vignette", min: 0, max: 1, step: 0.02, default: 0.5 },
    ],
    fragment: `${HEADER}
uniform float u_scanCount;
uniform float u_intensity;
uniform float u_curvature;
uniform float u_vignette;

vec2 curve(vec2 uv) {
  uv = uv * 2.0 - 1.0;
  vec2 offset = abs(uv.yx) * u_curvature;
  uv = uv + uv * offset * offset;
  return uv * 0.5 + 0.5;
}

void main() {
  vec2 uv = curve(v_uv);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec3 color = texture2D(u_texture, uv).rgb;
  float scan = sin(uv.y * u_scanCount) * 0.5 + 0.5;
  color *= 1.0 - u_intensity * (1.0 - scan);
  vec2 vig = uv * (1.0 - uv.yx);
  float v = pow(vig.x * vig.y * 15.0, u_vignette);
  color *= clamp(v, 0.0, 1.0);
  gl_FragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: "wave",
    name: "Wave Distortion",
    description: "Animated ripple / liquid warp",
    params: [
      { key: "amplitude", label: "Amplitude", min: 0, max: 0.1, step: 0.002, default: 0.02 },
      { key: "frequency", label: "Frequency", min: 1, max: 40, step: 1, default: 12 },
      { key: "speed", label: "Speed", min: 0, max: 4, step: 0.05, default: 1.0 },
    ],
    fragment: `${HEADER}
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_speed;

void main() {
  vec2 uv = v_uv;
  float t = u_time * u_speed;
  uv.x += sin(uv.y * u_frequency + t) * u_amplitude;
  uv.y += cos(uv.x * u_frequency + t) * u_amplitude;
  gl_FragColor = vec4(texture2D(u_texture, uv).rgb, 1.0);
}
`,
  },
]

export function getShader(id: string): ShaderDef {
  return SHADERS.find((s) => s.id === id) ?? SHADERS[0]
}

export function defaultParams(shader: ShaderDef): Record<string, number> {
  const out: Record<string, number> = {}
  for (const p of shader.params) out[p.key] = p.default
  return out
}
