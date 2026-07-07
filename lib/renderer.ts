import { VERTEX_SHADER, type ShaderDef } from "./shaders"

export type MediaSource =
  | { kind: "image"; el: HTMLImageElement; width: number; height: number }
  | { kind: "video"; el: HTMLVideoElement; width: number; height: number }

// Minimal WebGL renderer that draws a media texture through a fragment shader.
export class ShaderRenderer {
  private gl: WebGLRenderingContext
  private canvas: HTMLCanvasElement
  private program: WebGLProgram | null = null
  private positionBuffer: WebGLBuffer
  private texture: WebGLTexture
  private media: MediaSource | null = null
  private params: Record<string, number> = {}
  private startTime = performance.now()
  private raf = 0
  private currentFragment = ""

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true })
    if (!gl) throw new Error("WebGL is not supported in this browser")
    this.gl = gl

    // Full-screen quad
    this.positionBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )

    this.texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  }

  private compile(type: number, source: string): WebGLShader {
    const gl = this.gl
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader)
      gl.deleteShader(shader)
      throw new Error("Shader compile error: " + log)
    }
    return shader
  }

  setShader(shader: ShaderDef) {
    if (shader.fragment === this.currentFragment && this.program) return
    const gl = this.gl
    const vs = this.compile(gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = this.compile(gl.FRAGMENT_SHADER, shader.fragment)
    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error("Program link error: " + gl.getProgramInfoLog(program))
    }
    if (this.program) gl.deleteProgram(this.program)
    this.program = program
    this.currentFragment = shader.fragment
    gl.deleteShader(vs)
    gl.deleteShader(fs)
  }

  setParams(params: Record<string, number>) {
    this.params = params
  }

  setMedia(media: MediaSource) {
    this.media = media
    this.resize()
  }

  private resize() {
    if (!this.media) return
    const { width, height } = this.media
    // Cap resolution for performance while keeping aspect ratio.
    const maxDim = 1600
    const scale = Math.min(1, maxDim / Math.max(width, height))
    this.canvas.width = Math.round(width * scale)
    this.canvas.height = Math.round(height * scale)
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
  }

  private uploadTexture() {
    if (!this.media) return
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.media.el)
    } catch {
      // Frame may not be ready yet for video; ignore.
    }
  }

  private draw() {
    const gl = this.gl
    if (!this.program || !this.media) return

    // Re-upload every frame for video; images stay static but re-upload is cheap.
    this.uploadTexture()

    gl.useProgram(this.program)

    const posLoc = gl.getAttribLocation(this.program, "a_position")
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    const texLoc = gl.getUniformLocation(this.program, "u_texture")
    if (texLoc) gl.uniform1i(texLoc, 0)

    const resLoc = gl.getUniformLocation(this.program, "u_resolution")
    if (resLoc) gl.uniform2f(resLoc, this.canvas.width, this.canvas.height)

    const timeLoc = gl.getUniformLocation(this.program, "u_time")
    if (timeLoc) gl.uniform1f(timeLoc, (performance.now() - this.startTime) / 1000)

    for (const [key, value] of Object.entries(this.params)) {
      const loc = gl.getUniformLocation(this.program, "u_" + key)
      if (loc) gl.uniform1f(loc, value)
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  start() {
    const loop = () => {
      this.draw()
      this.raf = requestAnimationFrame(loop)
    }
    cancelAnimationFrame(this.raf)
    this.raf = requestAnimationFrame(loop)
  }

  stop() {
    cancelAnimationFrame(this.raf)
  }

  // Returns a PNG data URL of the current frame.
  capture(): string {
    this.draw()
    return this.canvas.toDataURL("image/png")
  }

  dispose() {
    this.stop()
    const gl = this.gl
    if (this.program) gl.deleteProgram(this.program)
    gl.deleteBuffer(this.positionBuffer)
    gl.deleteTexture(this.texture)
  }
}
