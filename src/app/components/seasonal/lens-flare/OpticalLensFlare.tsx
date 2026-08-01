import React from 'react'

import {
  OPTICAL_LENS_FLARE_FRAGMENT_SHADER,
  OPTICAL_LENS_FLARE_VERTEX_SHADER,
} from './opticalLensFlareShaders'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const MAX_GHOSTS = 10
const FULL_TURN = Math.PI * 2
const PERSISTENT_MOTION_STARTED_AT = performance.now()

type RgbColor = readonly [number, number, number]

export type LensFlarePoint = Readonly<{
  x: number
  y: number
}>

export type LensFlareMotionMode = 'static' | 'horizontal' | 'pointer'
export type LensFlareMotionPreference = 'system' | 'animate' | 'reduce'
export type LensFlareStatus =
  | 'idle'
  | 'ready'
  | 'lost'
  | 'restored'
  | 'unsupported'
  | 'error'
  | 'destroyed'

export type LensFlareMotion = Readonly<{
  mode?: LensFlareMotionMode
  amplitude?: LensFlarePoint
  speed?: number
  phase?: number
  settlingTime?: number
  persistAcrossMounts?: boolean
}>

export type LensFlareSourceStyle = Readonly<{
  coreColor?: string
  haloColor?: string
  coreRadius?: number
  coreIntensity?: number
  haloRadius?: number
  haloIntensity?: number
}>

export type LensFlareRayStyle = Readonly<{
  color?: string
  length?: number
  intensity?: number
  count?: number
  softness?: number
  angle?: number
}>

export type LensFlareStreakStyle = Readonly<{
  color?: string
  length?: number
  width?: number
  intensity?: number
  angle?: number
}>

export type LensFlareGhostStyle = Readonly<{
  colorA?: string
  colorB?: string
  count?: number
  spread?: number
  scale?: number
  intensity?: number
  apertureSides?: number
  chroma?: number
  edgeSoftness?: number
  ringIntensity?: number
  breathe?: number
}>

export type OpticalLensFlareProps = Readonly<{
  source?: LensFlarePoint
  opticalCenter?: LensFlarePoint
  motion?: LensFlareMotion
  sourceStyle?: LensFlareSourceStyle
  rays?: LensFlareRayStyle
  streak?: LensFlareStreakStyle
  ghosts?: LensFlareGhostStyle
  intensity?: number
  maxDpr?: number
  resolutionScale?: number
  motionPreference?: LensFlareMotionPreference
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
  onStatusChange?: (status: LensFlareStatus) => void
}>

type ResolvedOptions = Readonly<{
  source: LensFlarePoint
  opticalCenter: LensFlarePoint
  motion: Required<LensFlareMotion>
  sourceStyle: Readonly<{
    coreColor: RgbColor
    haloColor: RgbColor
    coreRadius: number
    coreIntensity: number
    haloRadius: number
    haloIntensity: number
  }>
  rays: Readonly<{
    color: RgbColor
    length: number
    intensity: number
    count: number
    softness: number
    angle: number
  }>
  streak: Readonly<{
    color: RgbColor
    length: number
    width: number
    intensity: number
    angle: number
  }>
  ghosts: Readonly<{
    colorA: RgbColor
    colorB: RgbColor
    count: number
    spread: number
    scale: number
    intensity: number
    apertureSides: number
    chroma: number
    edgeSoftness: number
    ringIntensity: number
    breathe: number
  }>
  intensity: number
  maxDpr: number
  resolutionScale: number
  motionPreference: LensFlareMotionPreference
}>

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
  ghostData: WebGLUniformLocation
}>

const GHOST_PROFILE = new Float32Array([
  0.11, 0.025, 0.64, 0.08, 0.24, 0.054, 0.34, 0.2, 0.47, 0.032, 0.78, 0.92,
  0.54, 0.083, 0.22, 0.06, 0.88, 0.047, 0.62, 0.3, 1.02, 0.119, 0.16, 0.04,
  1.13, 0.058, 0.48, 0.86, 1.46, 0.096, 0.18, 0.4, 1.62, 0.041, 0.58, 0.96,
  1.88, 0.138, 0.11, 0.1,
])

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum)

const parseHexColor = (value: string, fallback: RgbColor): RgbColor => {
  const match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value.trim())

  if (!match) return fallback

  const raw = match[1]
  const expanded =
    raw.length === 3
      ? raw
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : raw
  const integer = Number.parseInt(expanded, 16)

  return [
    ((integer >> 16) & 255) / 255,
    ((integer >> 8) & 255) / 255,
    (integer & 255) / 255,
  ]
}

const resolveOptions = ({
  source,
  opticalCenter,
  motion,
  sourceStyle,
  rays,
  streak,
  ghosts,
  intensity,
  maxDpr,
  resolutionScale,
  motionPreference,
}: OpticalLensFlareProps): ResolvedOptions => ({
  source: {
    x: source?.x ?? 0.2,
    y: source?.y ?? 0.035,
  },
  opticalCenter: {
    x: opticalCenter?.x ?? 0.52,
    y: opticalCenter?.y ?? 0.61,
  },
  motion: {
    mode: motion?.mode ?? 'horizontal',
    amplitude: {
      x: Math.max(motion?.amplitude?.x ?? 0.18, 0),
      y: Math.max(motion?.amplitude?.y ?? 0, 0),
    },
    speed: Math.max(motion?.speed ?? 0.035, 0),
    phase: motion?.phase ?? 0,
    settlingTime: Math.max(motion?.settlingTime ?? 0.38, 0.001),
    persistAcrossMounts: motion?.persistAcrossMounts ?? false,
  },
  sourceStyle: {
    coreColor: parseHexColor(
      sourceStyle?.coreColor ?? '#fff9e8',
      [1, 0.97, 0.88],
    ),
    haloColor: parseHexColor(
      sourceStyle?.haloColor ?? '#ffdcb3',
      [1, 0.82, 0.62],
    ),
    coreRadius: Math.max(sourceStyle?.coreRadius ?? 0.032, 0.001),
    coreIntensity: Math.max(sourceStyle?.coreIntensity ?? 1.12, 0),
    haloRadius: Math.max(sourceStyle?.haloRadius ?? 0.18, 0.002),
    haloIntensity: Math.max(sourceStyle?.haloIntensity ?? 0.24, 0),
  },
  rays: {
    color: parseHexColor(rays?.color ?? '#c8edff', [0.78, 0.92, 1]),
    length: Math.max(rays?.length ?? 0.82, 0.001),
    intensity: Math.max(rays?.intensity ?? 0.095, 0),
    count: clamp(Math.round(rays?.count ?? 6), 2, 12),
    softness: clamp(rays?.softness ?? 0.78, 0, 1),
    angle: rays?.angle ?? -0.1,
  },
  streak: {
    color: parseHexColor(streak?.color ?? '#b9e8ff', [0.73, 0.91, 1]),
    length: Math.max(streak?.length ?? 1.05, 0.001),
    width: Math.max(streak?.width ?? 0.005, 0.0005),
    intensity: Math.max(streak?.intensity ?? 0.13, 0),
    angle: streak?.angle ?? -0.018,
  },
  ghosts: {
    colorA: parseHexColor(ghosts?.colorA ?? '#fff1d8', [1, 0.91, 0.77]),
    colorB: parseHexColor(ghosts?.colorB ?? '#79e9ff', [0.48, 0.91, 1]),
    count: clamp(Math.round(ghosts?.count ?? 9), 0, MAX_GHOSTS),
    spread: Math.max(ghosts?.spread ?? 1, 0),
    scale: Math.max(ghosts?.scale ?? 1.08, 0),
    intensity: Math.max(ghosts?.intensity ?? 0.54, 0),
    apertureSides: clamp(Math.round(ghosts?.apertureSides ?? 6), 3, 12),
    chroma: clamp(ghosts?.chroma ?? 0.12, 0, 0.5),
    edgeSoftness: clamp(ghosts?.edgeSoftness ?? 0.045, 0.005, 0.25),
    ringIntensity: clamp(ghosts?.ringIntensity ?? 0.6, 0, 1.5),
    breathe: clamp(ghosts?.breathe ?? 0.025, 0, 0.25),
  },
  intensity: Math.max(intensity ?? 0.82, 0),
  maxDpr: clamp(maxDpr ?? 1.5, 0.5, 2),
  resolutionScale: clamp(resolutionScale ?? 0.9, 0.5, 1),
  motionPreference: motionPreference ?? 'system',
})

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
  ghostData: getUniform(gl, program, 'uGhostData[0]'),
})

const setColor = (
  gl: WebGL2RenderingContext,
  location: WebGLUniformLocation,
  color: RgbColor,
): void => {
  gl.uniform3f(location, color[0], color[1], color[2])
}

const shouldReduceMotion = (
  preference: LensFlareMotionPreference,
  systemPreference: boolean,
): boolean =>
  preference === 'reduce' || (preference === 'system' && systemPreference)

const OpticalLensFlare = (props: OpticalLensFlareProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const optionsRef = React.useRef<ResolvedOptions>(resolveOptions(props))
  const requestRenderRef = React.useRef<(() => void) | null>(null)
  const onErrorRef = React.useRef(props.onError)
  const onStatusChangeRef = React.useRef(props.onStatusChange)
  const [contextVersion, setContextVersion] = React.useState(0)
  const [status, setStatus] = React.useState<LensFlareStatus>('idle')

  const resolvedOptions = React.useMemo(() => resolveOptions(props), [props])

  React.useLayoutEffect(() => {
    optionsRef.current = resolvedOptions
    onErrorRef.current = props.onError
    onStatusChangeRef.current = props.onStatusChange
    requestRenderRef.current?.()
  }, [props.onError, props.onStatusChange, resolvedOptions])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false
    let frameId: number | null = null
    let lastFrameTime = performance.now()
    const startTime = lastFrameTime
    let systemReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches
    let currentSource: { x: number; y: number } | null = null
    let pointerSource = { ...optionsRef.current.source }

    const updateStatus = (nextStatus: LensFlareStatus): void => {
      if (disposed) return
      setStatus(nextStatus)
      onStatusChangeRef.current?.(nextStatus)
    }

    const reportError = (error: unknown): void => {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error))
      updateStatus('error')
      onErrorRef.current?.(normalizedError)
    }

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'low-power',
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      stencil: false,
    })

    if (!gl) {
      updateStatus('unsupported')
      onErrorRef.current?.(
        new Error('WebGL2 is unavailable; the Summer lens flare was skipped.'),
      )
      return
    }

    let program: WebGLProgram | null = null
    let vertexArray: WebGLVertexArrayObject | null = null
    let uniforms: UniformLocations | null = null

    try {
      program = createProgram(gl)
      const allocatedVertexArray = gl.createVertexArray()
      if (!allocatedVertexArray) {
        gl.deleteProgram(program)
        program = null
        throw new Error('Unable to allocate the lens flare vertex array.')
      }
      vertexArray = allocatedVertexArray
      uniforms = getUniformLocations(gl, program)
    } catch (error) {
      if (vertexArray) gl.deleteVertexArray(vertexArray)
      if (program) gl.deleteProgram(program)
      reportError(error)
      return
    }

    if (!program || !vertexArray || !uniforms) return

    gl.disable(gl.BLEND)
    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)
    gl.useProgram(program)
    gl.bindVertexArray(vertexArray)

    const resize = (): void => {
      const bounds = canvas.getBoundingClientRect()
      const options = optionsRef.current
      const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr)
      const scale = dpr * options.resolutionScale
      const width = Math.max(Math.round(bounds.width * scale), 1)
      const height = Math.max(Math.round(bounds.height * scale), 1)

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      gl.viewport(0, 0, width, height)
    }

    const resolveSource = (
      elapsed: number,
      deltaTime: number,
      reducedMotion: boolean,
    ): LensFlarePoint => {
      const options = optionsRef.current
      const { motion, source } = options
      let targetX = source.x
      let targetY = source.y

      if (!reducedMotion && motion.mode === 'horizontal') {
        const phase = elapsed * motion.speed * FULL_TURN + motion.phase
        const horizontalWave = -Math.cos(phase)
        targetX += motion.amplitude.x * horizontalWave
        targetY += motion.amplitude.y * Math.sin(phase)
      } else if (!reducedMotion && motion.mode === 'pointer') {
        targetX = pointerSource.x
        targetY = pointerSource.y
      }

      if (
        currentSource === null ||
        reducedMotion ||
        motion.mode === 'static' ||
        (motion.mode === 'horizontal' && motion.persistAcrossMounts)
      ) {
        currentSource = { x: targetX, y: targetY }
        return currentSource
      }

      const smoothing = 1 - Math.exp(-deltaTime / motion.settlingTime)
      currentSource.x += (targetX - currentSource.x) * smoothing
      currentSource.y += (targetY - currentSource.y) * smoothing

      return currentSource
    }

    const draw = (now: number): void => {
      frameId = null
      if (disposed || document.hidden) return

      resize()

      const options = optionsRef.current
      const reducedMotion = shouldReduceMotion(
        options.motionPreference,
        systemReducedMotion,
      )
      const deltaTime = Math.min(
        Math.max((now - lastFrameTime) / 1000, 0),
        0.05,
      )
      const timelineStart = options.motion.persistAcrossMounts
        ? PERSISTENT_MOTION_STARTED_AT
        : startTime
      const elapsed = reducedMotion
        ? 0
        : Math.max((now - timelineStart) / 1000, 0)
      const source = resolveSource(elapsed, deltaTime, reducedMotion)
      lastFrameTime = now

      canvas.dataset.lensFlareSourceX = source.x.toFixed(4)
      canvas.dataset.lensFlareSourceY = source.y.toFixed(4)
      canvas.dataset.lensFlareGhostCount = String(options.ghosts.count)
      canvas.dataset.lensFlareMotionElapsed = elapsed.toFixed(3)
      canvas.dataset.lensFlareMotionTimeline = options.motion
        .persistAcrossMounts
        ? 'persistent'
        : 'mount'

      gl.useProgram(program)
      gl.bindVertexArray(vertexArray)
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
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
      gl.uniform4fv(uniforms.ghostData, GHOST_PROFILE)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      const animated =
        !reducedMotion &&
        (options.motion.mode === 'horizontal' || options.ghosts.breathe > 0)
      if (animated) requestFrame()
    }

    const requestFrame = (): void => {
      if (disposed || frameId !== null || document.hidden) return
      frameId = window.requestAnimationFrame(draw)
    }

    const handlePointerMove = (event: PointerEvent): void => {
      pointerSource = {
        x: event.clientX / Math.max(window.innerWidth, 1),
        y: event.clientY / Math.max(window.innerHeight, 1),
      }

      if (optionsRef.current.motion.mode === 'pointer') requestFrame()
    }

    const handleVisibilityChange = (): void => {
      if (document.hidden) {
        if (frameId !== null) window.cancelAnimationFrame(frameId)
        frameId = null
        return
      }

      lastFrameTime = performance.now()
      requestFrame()
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    const handleMotionPreference = (event: MediaQueryListEvent): void => {
      systemReducedMotion = event.matches
      requestFrame()
    }

    const handleContextLost = (event: Event): void => {
      event.preventDefault()
      if (frameId !== null) window.cancelAnimationFrame(frameId)
      frameId = null
      updateStatus('lost')
    }

    const handleContextRestored = (): void => {
      updateStatus('restored')
      setContextVersion((version) => version + 1)
    }

    const resizeObserver = new ResizeObserver(() => {
      resize()
      requestFrame()
    })

    resizeObserver.observe(canvas)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('visibilitychange', handleVisibilityChange)
    mediaQuery.addEventListener('change', handleMotionPreference)
    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)
    requestRenderRef.current = requestFrame
    resize()
    updateStatus('ready')
    requestFrame()

    return () => {
      disposed = true
      requestRenderRef.current = null
      if (frameId !== null) window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      mediaQuery.removeEventListener('change', handleMotionPreference)
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
      gl.bindVertexArray(null)
      gl.useProgram(null)
      gl.deleteVertexArray(vertexArray)
      gl.deleteProgram(program)
      onStatusChangeRef.current?.('destroyed')
    }
  }, [contextVersion])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={props.className}
      data-lens-flare-engine="hybus-optical-webgl2"
      data-lens-flare-status={status}
      style={props.style}
    />
  )
}

export default OpticalLensFlare
