import {
  OPTICAL_LENS_FLARE_FRAGMENT_SHADER,
  OPTICAL_LENS_FLARE_VERTEX_SHADER,
} from './opticalLensFlareShaders'
import type {
  LensFlareFrameSnapshot,
  LensFlarePoint,
  LensFlareRenderSize,
  LensFlareTimeline,
  ResolvedLensFlareOptions,
  RgbColor,
  SerializedLensFlareError,
} from './opticalLensFlareTypes'

const FULL_TURN = Math.PI * 2

const WEBGL_CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  antialias: false,
  depth: false,
  failIfMajorPerformanceCaveat: false,
  powerPreference: 'low-power',
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  stencil: false,
}

type LensFlareSurface = {
  getContext: (
    contextId: 'webgl2',
    options?: WebGLContextAttributes,
  ) => WebGL2RenderingContext | null
  height: number
  width: number
}

type UniformLocations = Readonly<{
  resolution: WebGLUniformLocation
  time: WebGLUniformLocation
  intensity: WebGLUniformLocation
  source: WebGLUniformLocation
  opticalCenter: WebGLUniformLocation
  coreColor: WebGLUniformLocation
  haloColor: WebGLUniformLocation
  rayColor: WebGLUniformLocation
  streakColor: WebGLUniformLocation
  ghostColorA: WebGLUniformLocation
  ghostColorB: WebGLUniformLocation
  sourceStyle: WebGLUniformLocation
  rayStyle: WebGLUniformLocation
  rayAngle: WebGLUniformLocation
  streakStyle: WebGLUniformLocation
  ghostStyle: WebGLUniformLocation
  ghostAppearance: WebGLUniformLocation
  ghostRingIntensity: WebGLUniformLocation
  ghostMotion: WebGLUniformLocation
  ghostData: WebGLUniformLocation
}>

type LensFlareResources = Readonly<{
  program: WebGLProgram
  vertexArray: WebGLVertexArrayObject
  uniforms: UniformLocations
}>

// Keep one optical descriptor per line for visual tuning.
// prettier-ignore
const GHOST_PROFILE = new Float32Array([
  // axis position, radius, local gain, roundness
  0.18, 0.018, 0.36, 0.88,
  0.25, 0.045, 0.44, 0.72,
  0.31, 0.026, 0.42, 0.54,
  0.36, 0.082, 0.40, 0.68,
  0.48, 0.015, 0.35, 0.92,
  0.54, 0.038, 0.46, 0.80,
  0.62, 0.022, 0.38, 0.58,
  0.68, 0.100, 0.38, 0.74,
  0.76, 0.032, 0.48, 0.90,
  0.82, 0.058, 0.42, 0.62,
  0.88, 0.017, 0.37, 0.96,
  0.94, 0.042, 0.45, 0.84,
  1.02, 0.088, 0.36, 0.70,
  1.12, 0.028, 0.47, 0.56,
  1.24, 0.064, 0.40, 0.88,
  1.38, 0.020, 0.35, 0.94,
  1.52, 0.110, 0.32, 0.72,
  1.68, 0.036, 0.44, 0.82,
])

export class LensFlareUnsupportedError extends Error {
  constructor() {
    super('WebGL2 is unavailable; the Summer lens flare was skipped.')
    this.name = 'LensFlareUnsupportedError'
  }
}

const createShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader => {
  const shader = gl.createShader(type)

  if (!shader) throw new Error('Unable to allocate a WebGL shader.')

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader error.'
    gl.deleteShader(shader)
    throw new Error(`Lens flare shader compilation failed: ${message}`)
  }

  return shader
}

const createProgram = (gl: WebGL2RenderingContext): WebGLProgram => {
  const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    OPTICAL_LENS_FLARE_VERTEX_SHADER,
  )
  let fragmentShader: WebGLShader

  try {
    fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      OPTICAL_LENS_FLARE_FRAGMENT_SHADER,
    )
  } catch (error) {
    gl.deleteShader(vertexShader)
    throw error
  }

  const program = gl.createProgram()

  if (!program) {
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    throw new Error('Unable to allocate a WebGL program.')
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'Unknown program error.'
    gl.deleteProgram(program)
    throw new Error(`Lens flare program linking failed: ${message}`)
  }

  return program
}

const getUniform = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation => {
  const location = gl.getUniformLocation(program, name)

  if (location === null) {
    throw new Error(`Lens flare uniform is unavailable: ${name}`)
  }

  return location
}

const getUniformLocations = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
): UniformLocations => ({
  resolution: getUniform(gl, program, 'uResolution'),
  time: getUniform(gl, program, 'uTime'),
  intensity: getUniform(gl, program, 'uIntensity'),
  source: getUniform(gl, program, 'uSource'),
  opticalCenter: getUniform(gl, program, 'uOpticalCenter'),
  coreColor: getUniform(gl, program, 'uCoreColor'),
  haloColor: getUniform(gl, program, 'uHaloColor'),
  rayColor: getUniform(gl, program, 'uRayColor'),
  streakColor: getUniform(gl, program, 'uStreakColor'),
  ghostColorA: getUniform(gl, program, 'uGhostColorA'),
  ghostColorB: getUniform(gl, program, 'uGhostColorB'),
  sourceStyle: getUniform(gl, program, 'uSourceStyle'),
  rayStyle: getUniform(gl, program, 'uRayStyle'),
  rayAngle: getUniform(gl, program, 'uRayAngle'),
  streakStyle: getUniform(gl, program, 'uStreakStyle'),
  ghostStyle: getUniform(gl, program, 'uGhostStyle'),
  ghostAppearance: getUniform(gl, program, 'uGhostAppearance'),
  ghostRingIntensity: getUniform(gl, program, 'uGhostRingIntensity'),
  ghostMotion: getUniform(gl, program, 'uGhostMotion'),
  ghostData: getUniform(gl, program, 'uGhostData[0]'),
})

const createLensFlareResources = (
  gl: WebGL2RenderingContext,
): LensFlareResources => {
  const program = createProgram(gl)
  const vertexArray = gl.createVertexArray()

  if (!vertexArray) {
    gl.deleteProgram(program)
    throw new Error('Unable to allocate the lens flare vertex array.')
  }

  try {
    return {
      program,
      vertexArray,
      uniforms: getUniformLocations(gl, program),
    }
  } catch (error) {
    gl.deleteVertexArray(vertexArray)
    gl.deleteProgram(program)
    throw error
  }
}

const deleteLensFlareResources = (
  gl: WebGL2RenderingContext,
  resources: LensFlareResources,
): void => {
  gl.deleteVertexArray(resources.vertexArray)
  gl.deleteProgram(resources.program)
}

const setColor = (
  gl: WebGL2RenderingContext,
  location: WebGLUniformLocation,
  color: RgbColor,
): void => {
  gl.uniform3f(location, color[0], color[1], color[2])
}

export const toAbsoluteLensFlareTime = (timestamp: number): number =>
  performance.timeOrigin + timestamp

export const serializeLensFlareError = (
  error: unknown,
): SerializedLensFlareError => {
  const normalizedError =
    error instanceof Error ? error : new Error(String(error))

  return {
    message: normalizedError.message,
    name: normalizedError.name,
    ...(normalizedError.stack ? { stack: normalizedError.stack } : {}),
  }
}

export class OpticalLensFlareRenderer {
  private readonly gl: WebGL2RenderingContext
  private readonly surface: LensFlareSurface
  private readonly timeline: LensFlareTimeline
  private resources: LensFlareResources
  private options: ResolvedLensFlareOptions
  private currentSource: { x: number; y: number } | null = null
  private pointerSource: { x: number; y: number }
  private lastFrameTime: number
  private destroyed = false

  constructor(
    surface: LensFlareSurface,
    options: ResolvedLensFlareOptions,
    timeline: LensFlareTimeline,
  ) {
    const gl = surface.getContext('webgl2', WEBGL_CONTEXT_ATTRIBUTES)

    if (!gl) throw new LensFlareUnsupportedError()

    this.gl = gl
    this.surface = surface
    this.timeline = timeline
    this.options = options
    this.pointerSource = { ...options.source }
    this.lastFrameTime = timeline.mountStartedAt
    this.resources = createLensFlareResources(gl)
    this.configureContext()
  }

  private configureContext(): void {
    const { gl, resources } = this

    gl.disable(gl.BLEND)
    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)
    gl.useProgram(resources.program)
    gl.bindVertexArray(resources.vertexArray)
  }

  private resolveSource(
    elapsed: number,
    deltaTime: number,
    reducedMotion: boolean,
  ): LensFlarePoint {
    const { motion, source } = this.options
    let targetX = source.x
    let targetY = source.y

    if (!reducedMotion && motion.mode === 'horizontal') {
      const phase = elapsed * motion.speed * FULL_TURN + motion.phase
      const horizontalWave = -Math.cos(phase)
      targetX += motion.amplitude.x * horizontalWave
      targetY += motion.amplitude.y * Math.sin(phase)
    } else if (!reducedMotion && motion.mode === 'pointer') {
      targetX = this.pointerSource.x
      targetY = this.pointerSource.y
    }

    if (
      this.currentSource === null ||
      reducedMotion ||
      motion.mode === 'static' ||
      (motion.mode === 'horizontal' && motion.persistAcrossMounts)
    ) {
      this.currentSource = { x: targetX, y: targetY }
      return this.currentSource
    }

    const smoothing = 1 - Math.exp(-deltaTime / motion.settlingTime)
    this.currentSource.x += (targetX - this.currentSource.x) * smoothing
    this.currentSource.y += (targetY - this.currentSource.y) * smoothing

    return this.currentSource
  }

  updateOptions(options: ResolvedLensFlareOptions): void {
    this.options = options
  }

  updatePointer(point: LensFlarePoint): void {
    this.pointerSource = { ...point }
  }

  resetLastFrameTime(timestamp: number): void {
    this.lastFrameTime = timestamp
  }

  resize({ height, width }: LensFlareRenderSize): void {
    const resolvedWidth = Math.max(Math.round(width), 1)
    const resolvedHeight = Math.max(Math.round(height), 1)

    if (this.surface.width !== resolvedWidth) {
      this.surface.width = resolvedWidth
    }
    if (this.surface.height !== resolvedHeight) {
      this.surface.height = resolvedHeight
    }

    this.gl.viewport(0, 0, resolvedWidth, resolvedHeight)
  }

  isAnimated(reducedMotion: boolean): boolean {
    const { ghosts, motion } = this.options

    return (
      !reducedMotion &&
      (motion.mode === 'horizontal' ||
        ghosts.breathe > 0 ||
        (ghosts.driftSpeed > 0 &&
          (ghosts.drift > 0 || ghosts.fadeVariation > 0)))
    )
  }

  draw(
    timestamp: number,
    reducedMotion: boolean,
  ): LensFlareFrameSnapshot | null {
    if (this.destroyed || this.gl.isContextLost()) return null

    const { gl, options, resources, surface, timeline } = this
    const { program, uniforms, vertexArray } = resources
    const deltaTime = Math.min(
      Math.max((timestamp - this.lastFrameTime) / 1000, 0),
      0.05,
    )
    const timelineStart = options.motion.persistAcrossMounts
      ? timeline.persistentStartedAt
      : timeline.mountStartedAt
    const elapsed = reducedMotion
      ? 0
      : Math.max((timestamp - timelineStart) / 1000, 0)
    const source = this.resolveSource(elapsed, deltaTime, reducedMotion)
    const ghostDrift =
      options.ghosts.drift * ((elapsed * options.ghosts.driftSpeed) % 1)
    this.lastFrameTime = timestamp

    gl.useProgram(program)
    gl.bindVertexArray(vertexArray)
    gl.uniform2f(uniforms.resolution, surface.width, surface.height)
    gl.uniform1f(uniforms.time, elapsed)
    gl.uniform1f(uniforms.intensity, options.intensity)
    gl.uniform2f(uniforms.source, source.x, source.y)
    gl.uniform2f(
      uniforms.opticalCenter,
      options.opticalCenter.x,
      options.opticalCenter.y,
    )
    setColor(gl, uniforms.coreColor, options.sourceStyle.coreColor)
    setColor(gl, uniforms.haloColor, options.sourceStyle.haloColor)
    setColor(gl, uniforms.rayColor, options.rays.color)
    setColor(gl, uniforms.streakColor, options.streak.color)
    setColor(gl, uniforms.ghostColorA, options.ghosts.colorA)
    setColor(gl, uniforms.ghostColorB, options.ghosts.colorB)
    gl.uniform4f(
      uniforms.sourceStyle,
      options.sourceStyle.coreRadius,
      options.sourceStyle.coreIntensity,
      options.sourceStyle.haloRadius,
      options.sourceStyle.haloIntensity,
    )
    gl.uniform4f(
      uniforms.rayStyle,
      options.rays.length,
      options.rays.intensity,
      options.rays.count,
      options.rays.softness,
    )
    gl.uniform1f(uniforms.rayAngle, options.rays.angle)
    gl.uniform4f(
      uniforms.streakStyle,
      options.streak.length,
      options.streak.width,
      options.streak.intensity,
      options.streak.angle,
    )
    gl.uniform4f(
      uniforms.ghostStyle,
      options.ghosts.count,
      options.ghosts.spread,
      options.ghosts.scale,
      options.ghosts.intensity,
    )
    gl.uniform4f(
      uniforms.ghostAppearance,
      options.ghosts.apertureSides,
      options.ghosts.chroma,
      options.ghosts.edgeSoftness,
      reducedMotion ? 0 : options.ghosts.breathe,
    )
    gl.uniform1f(uniforms.ghostRingIntensity, options.ghosts.ringIntensity)
    gl.uniform4f(
      uniforms.ghostMotion,
      options.ghosts.drift,
      options.ghosts.driftSpeed,
      reducedMotion ? 0 : options.ghosts.fadeVariation,
      options.ghosts.scatter,
    )
    gl.uniform4fv(uniforms.ghostData, GHOST_PROFILE)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    return {
      elapsed,
      ghostCount: options.ghosts.count,
      ghostDrift,
      source,
      timeline: options.motion.persistAcrossMounts ? 'persistent' : 'mount',
    }
  }

  restore(): void {
    if (this.destroyed) return

    this.resources = createLensFlareResources(this.gl)
    this.configureContext()
  }

  destroy(releaseContext = false): void {
    if (this.destroyed) return

    this.destroyed = true
    this.gl.bindVertexArray(null)
    this.gl.useProgram(null)
    deleteLensFlareResources(this.gl, this.resources)

    if (releaseContext) {
      this.gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }
}
