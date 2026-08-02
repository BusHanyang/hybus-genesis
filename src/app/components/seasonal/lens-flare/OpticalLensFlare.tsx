import React from 'react'

import {
  LensFlareUnsupportedError,
  OpticalLensFlareRenderer,
  toAbsoluteLensFlareTime,
} from './opticalLensFlareRenderer'
import type {
  LensFlareFrameSnapshot,
  LensFlarePoint,
  LensFlareRenderSize,
  LensFlareStatus,
  LensFlareTimeline,
  LensFlareWorkerRequest,
  LensFlareWorkerResponse,
  OpticalLensFlareProps,
  ResolvedLensFlareOptions,
  RgbColor,
  SerializedLensFlareError,
} from './opticalLensFlareTypes'

export type {
  LensFlareGhostStyle,
  LensFlareMotion,
  LensFlareMotionMode,
  LensFlareMotionPreference,
  LensFlarePoint,
  LensFlareRayStyle,
  LensFlareSourceStyle,
  LensFlareStatus,
  LensFlareStreakStyle,
  OpticalLensFlareProps,
} from './opticalLensFlareTypes'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const MAX_GHOSTS = 18
const PERSISTENT_MOTION_STARTED_AT = performance.now()
const PERSISTENT_MOTION_STARTED_AT_ABSOLUTE = toAbsoluteLensFlareTime(
  PERSISTENT_MOTION_STARTED_AT,
)

type LensFlareBackend = Readonly<{
  destroy: () => void
  requestRender: () => void
  resize: (size: LensFlareRenderSize) => void
  setVisibility: (hidden: boolean) => void
  updateOptions: (
    options: ResolvedLensFlareOptions,
    reducedMotion: boolean,
  ) => void
  updatePointer: (point: LensFlarePoint) => void
}>

type LensFlareBackendCallbacks = Readonly<{
  onError: (error: unknown) => void
  onFrame: (snapshot: LensFlareFrameSnapshot) => void
  onStatus: (status: LensFlareStatus) => void
}>

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
}: OpticalLensFlareProps): ResolvedLensFlareOptions => ({
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
    drift: clamp(ghosts?.drift ?? 0, 0, 2.5),
    driftSpeed: clamp(ghosts?.driftSpeed ?? 0, 0, 0.2),
    fadeVariation: clamp(ghosts?.fadeVariation ?? 0, 0, 0.98),
    scatter: clamp(ghosts?.scatter ?? 0, 0, 0.08),
  },
  intensity: Math.max(intensity ?? 0.82, 0),
  maxDpr: clamp(maxDpr ?? 1.5, 0.5, 2),
  resolutionScale: clamp(resolutionScale ?? 0.9, 0.5, 1),
  motionPreference: motionPreference ?? 'system',
})

const shouldReduceMotion = (
  options: ResolvedLensFlareOptions,
  systemPreference: boolean,
): boolean =>
  options.motionPreference === 'reduce' ||
  (options.motionPreference === 'system' && systemPreference)

const getRenderSize = (
  canvas: HTMLCanvasElement,
  options: ResolvedLensFlareOptions,
): LensFlareRenderSize => {
  const bounds = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr)
  const scale = dpr * options.resolutionScale

  return {
    height: Math.max(Math.round(bounds.height * scale), 1),
    width: Math.max(Math.round(bounds.width * scale), 1),
  }
}

const updateCanvasDiagnostics = (
  canvas: HTMLCanvasElement,
  snapshot: LensFlareFrameSnapshot,
): void => {
  canvas.dataset.lensFlareSourceX = snapshot.source.x.toFixed(4)
  canvas.dataset.lensFlareSourceY = snapshot.source.y.toFixed(4)
  canvas.dataset.lensFlareGhostCount = String(snapshot.ghostCount)
  canvas.dataset.lensFlareGhostDrift = snapshot.ghostDrift.toFixed(4)
  canvas.dataset.lensFlareMotionElapsed = snapshot.elapsed.toFixed(3)
  canvas.dataset.lensFlareMotionTimeline = snapshot.timeline
}

const deserializeError = (error: SerializedLensFlareError): Error => {
  const normalizedError = new Error(error.message)
  normalizedError.name = error.name
  if (error.stack) normalizedError.stack = error.stack

  return normalizedError
}

const createMainThreadBackend = (
  canvas: HTMLCanvasElement,
  options: ResolvedLensFlareOptions,
  timeline: LensFlareTimeline,
  initialReducedMotion: boolean,
  initialHidden: boolean,
  initialPointer: LensFlarePoint,
  initialSize: LensFlareRenderSize,
  callbacks: LensFlareBackendCallbacks,
): LensFlareBackend => {
  const renderer = new OpticalLensFlareRenderer(canvas, options, timeline)
  let currentOptions = options
  let reducedMotion = initialReducedMotion
  let hidden = initialHidden
  let contextLost = false
  let frameId: number | null = null
  let destroyed = false

  renderer.updatePointer(initialPointer)
  renderer.resize(initialSize)

  const cancelFrame = (): void => {
    if (frameId === null) return

    window.cancelAnimationFrame(frameId)
    frameId = null
  }

  const requestFrame = (): void => {
    if (destroyed || hidden || contextLost || frameId !== null) return

    frameId = window.requestAnimationFrame(draw)
  }

  const draw = (timestamp: number): void => {
    frameId = null
    if (destroyed || hidden || contextLost) return

    try {
      const snapshot = renderer.draw(
        toAbsoluteLensFlareTime(timestamp),
        reducedMotion,
      )

      if (snapshot) callbacks.onFrame(snapshot)
      if (renderer.isAnimated(reducedMotion)) requestFrame()
    } catch (error) {
      callbacks.onError(error)
    }
  }

  const handleContextLost = (event: Event): void => {
    event.preventDefault()
    contextLost = true
    cancelFrame()
    callbacks.onStatus('lost')
  }

  const handleContextRestored = (): void => {
    callbacks.onStatus('restored')

    try {
      renderer.restore()
      renderer.resetLastFrameTime(toAbsoluteLensFlareTime(performance.now()))
      contextLost = false
      callbacks.onStatus('destroyed')
      callbacks.onStatus('ready')
      requestFrame()
    } catch (error) {
      callbacks.onError(error)
    }
  }

  canvas.addEventListener('webglcontextlost', handleContextLost)
  canvas.addEventListener('webglcontextrestored', handleContextRestored)
  callbacks.onStatus('ready')
  requestFrame()

  return {
    destroy: () => {
      if (destroyed) return

      destroyed = true
      cancelFrame()
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
      renderer.destroy()
    },
    requestRender: requestFrame,
    resize: (size) => {
      renderer.resize(size)
      requestFrame()
    },
    setVisibility: (nextHidden) => {
      hidden = nextHidden

      if (hidden) {
        cancelFrame()
      } else {
        renderer.resetLastFrameTime(toAbsoluteLensFlareTime(performance.now()))
        requestFrame()
      }
    },
    updateOptions: (nextOptions, nextReducedMotion) => {
      currentOptions = nextOptions
      reducedMotion = nextReducedMotion
      renderer.updateOptions(nextOptions)
      requestFrame()
    },
    updatePointer: (point) => {
      renderer.updatePointer(point)
      if (currentOptions.motion.mode === 'pointer') requestFrame()
    },
  }
}

const createWorkerBackend = (
  worker: Worker,
  initialOptions: ResolvedLensFlareOptions,
  initialPointer: LensFlarePoint,
): LensFlareBackend => {
  let currentOptions = initialOptions
  let pointer = initialPointer
  const postMessage = (message: LensFlareWorkerRequest): void => {
    worker.postMessage(message)
  }

  return {
    destroy: () => postMessage({ type: 'destroy' }),
    requestRender: () => postMessage({ type: 'render' }),
    resize: (size) => postMessage({ type: 'resize', size }),
    setVisibility: (hidden) => postMessage({ type: 'visibility', hidden }),
    updateOptions: (options, reducedMotion) => {
      currentOptions = options
      if (options.motion.mode === 'pointer') {
        postMessage({ type: 'pointer', point: pointer })
      }
      postMessage({ type: 'options', options, reducedMotion })
    },
    updatePointer: (point) => {
      pointer = point
      if (currentOptions.motion.mode === 'pointer') {
        postMessage({ type: 'pointer', point })
      }
    },
  }
}

const OpticalLensFlare = ({
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
  className,
  style,
  onError,
  onStatusChange,
}: OpticalLensFlareProps) => {
  const resolvedOptions = React.useMemo(
    () =>
      resolveOptions({
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
      }),
    [
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
    ],
  )
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const optionsRef = React.useRef<ResolvedLensFlareOptions>(resolvedOptions)
  const requestRenderRef = React.useRef<(() => void) | null>(null)
  const onErrorRef = React.useRef(onError)
  const onStatusChangeRef = React.useRef(onStatusChange)
  const forceMainThreadRef = React.useRef(false)
  const [canvasVersion, setCanvasVersion] = React.useState(0)
  const [status, setStatus] = React.useState<LensFlareStatus>('idle')

  React.useLayoutEffect(() => {
    optionsRef.current = resolvedOptions
    onErrorRef.current = onError
    onStatusChangeRef.current = onStatusChange
    requestRenderRef.current?.()
  }, [onError, onStatusChange, resolvedOptions])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false
    let backend: LensFlareBackend | null = null
    let worker: Worker | null = null
    let workerTransferred = false
    let switchingToMainThread = false
    let hasRenderer = false
    let systemReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches
    let pointerSource = { ...optionsRef.current.source }
    const timeline: LensFlareTimeline = {
      mountStartedAt: toAbsoluteLensFlareTime(performance.now()),
      persistentStartedAt: PERSISTENT_MOTION_STARTED_AT_ABSOLUTE,
    }

    const updateStatus = (nextStatus: LensFlareStatus): void => {
      if (disposed) return
      if (nextStatus === 'ready') hasRenderer = true
      setStatus(nextStatus)
      onStatusChangeRef.current?.(nextStatus)
    }

    const reportError = (error: unknown): void => {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error))
      updateStatus('error')
      onErrorRef.current?.(normalizedError)
    }

    const getReducedMotion = (): boolean =>
      shouldReduceMotion(optionsRef.current, systemReducedMotion)

    const callbacks: LensFlareBackendCallbacks = {
      onError: reportError,
      onFrame: (snapshot) => {
        if (!disposed) updateCanvasDiagnostics(canvas, snapshot)
      },
      onStatus: updateStatus,
    }

    const startMainThreadBackend = (): void => {
      if (disposed) return

      try {
        canvas.dataset.lensFlareBackend = 'main-thread'
        backend = createMainThreadBackend(
          canvas,
          optionsRef.current,
          timeline,
          getReducedMotion(),
          document.hidden,
          pointerSource,
          getRenderSize(canvas, optionsRef.current),
          callbacks,
        )
      } catch (error) {
        if (error instanceof LensFlareUnsupportedError) {
          updateStatus('unsupported')
          onErrorRef.current?.(error)
          return
        }

        reportError(error)
      }
    }

    const replaceCanvasWithMainThreadBackend = (): void => {
      if (disposed || switchingToMainThread) return

      switchingToMainThread = true
      forceMainThreadRef.current = true
      backend = null
      worker?.terminate()
      worker = null
      setCanvasVersion((version) => version + 1)
    }

    const handleWorkerFailure = (): void => {
      if (disposed) return

      worker?.terminate()
      worker = null

      if (workerTransferred) {
        replaceCanvasWithMainThreadBackend()
      } else {
        startMainThreadBackend()
      }
    }

    const startWorkerBackend = (): void => {
      try {
        worker = new Worker(
          new URL('./opticalLensFlare.worker.ts', import.meta.url),
          {
            name: 'hybus-optical-lens-flare',
            type: 'module',
          },
        )
      } catch {
        startMainThreadBackend()
        return
      }

      worker.addEventListener(
        'message',
        (event: MessageEvent<LensFlareWorkerResponse>) => {
          if (disposed || !worker) return

          const message = event.data

          if (message.type === 'probe-result') {
            if (!message.supported) {
              worker.terminate()
              worker = null
              startMainThreadBackend()
              return
            }

            try {
              const offscreenCanvas = canvas.transferControlToOffscreen()
              workerTransferred = true
              canvas.dataset.lensFlareBackend = 'worker-offscreen'
              backend = createWorkerBackend(
                worker,
                optionsRef.current,
                pointerSource,
              )
              const initMessage: Extract<
                LensFlareWorkerRequest,
                { type: 'init' }
              > = {
                type: 'init',
                canvas: offscreenCanvas,
                hidden: document.hidden,
                options: optionsRef.current,
                pointer: pointerSource,
                reducedMotion: getReducedMotion(),
                size: getRenderSize(canvas, optionsRef.current),
                timeline,
              }
              worker.postMessage(initMessage, [offscreenCanvas])
            } catch {
              replaceCanvasWithMainThreadBackend()
            }
            return
          }

          if (message.type === 'frame') {
            updateCanvasDiagnostics(canvas, message.snapshot)
            return
          }

          if (message.type === 'status') {
            updateStatus(message.status)
            return
          }

          reportError(deserializeError(message.error))
          handleWorkerFailure()
        },
      )
      worker.addEventListener('error', (event) => {
        event.preventDefault()
        if (workerTransferred) {
          reportError(
            event.error instanceof Error
              ? event.error
              : new Error(event.message || 'The lens flare worker failed.'),
          )
        }
        handleWorkerFailure()
      })
      worker.addEventListener('messageerror', () => {
        if (workerTransferred) {
          reportError(new Error('The lens flare worker response was invalid.'))
        }
        handleWorkerFailure()
      })
      worker.postMessage({
        type: 'probe',
        options: optionsRef.current,
        reducedMotion: getReducedMotion(),
        timeline,
      } satisfies LensFlareWorkerRequest)
    }

    const handlePointerMove = (event: PointerEvent): void => {
      pointerSource = {
        x: event.clientX / Math.max(window.innerWidth, 1),
        y: event.clientY / Math.max(window.innerHeight, 1),
      }
      backend?.updatePointer(pointerSource)
    }

    const handleVisibilityChange = (): void => {
      backend?.setVisibility(document.hidden)
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    const handleMotionPreference = (event: MediaQueryListEvent): void => {
      systemReducedMotion = event.matches
      backend?.updateOptions(optionsRef.current, getReducedMotion())
    }

    const handleResize = (): void => {
      backend?.resize(getRenderSize(canvas, optionsRef.current))
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(canvas)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
    window.visualViewport?.addEventListener('resize', handleResize, {
      passive: true,
    })
    document.addEventListener('visibilitychange', handleVisibilityChange)
    mediaQuery.addEventListener('change', handleMotionPreference)
    requestRenderRef.current = () => {
      backend?.updateOptions(optionsRef.current, getReducedMotion())
      backend?.resize(getRenderSize(canvas, optionsRef.current))
      backend?.requestRender()
    }

    if (
      forceMainThreadRef.current ||
      typeof Worker !== 'function' ||
      typeof canvas.transferControlToOffscreen !== 'function'
    ) {
      startMainThreadBackend()
    } else {
      startWorkerBackend()
    }

    return () => {
      disposed = true
      requestRenderRef.current = null
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      mediaQuery.removeEventListener('change', handleMotionPreference)
      backend?.destroy()
      worker?.terminate()
      if (hasRenderer) onStatusChangeRef.current?.('destroyed')
    }
  }, [canvasVersion])

  return (
    <canvas
      key={canvasVersion}
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      data-lens-flare-engine="hybus-optical-webgl2"
      data-lens-flare-ghost-motion={`${resolvedOptions.ghosts.drift},${resolvedOptions.ghosts.driftSpeed},${resolvedOptions.ghosts.fadeVariation}`}
      data-lens-flare-status={status}
      style={style}
    />
  )
}

export default OpticalLensFlare
