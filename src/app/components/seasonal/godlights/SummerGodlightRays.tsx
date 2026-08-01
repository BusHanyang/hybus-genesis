import { GodLights, type SceneConfig } from 'godlights'
import { motion, useReducedMotion } from 'motion/react'
import React from 'react'

type ViewportSize = Readonly<{
  width: number
  height: number
}>

type RenderMetrics = ViewportSize &
  Readonly<{
    scale: number
  }>

type RaySpec = Readonly<{
  id: string
  direction: number
  rayWidth: number
  divergence: number
  fadeEndY: number
  blur: number
  baseOpacity: number
  peakOpacity: number
  duration: number
  phase: number
  reducedOpacity: number
}>

const TIMELINE_STARTED_AT =
  typeof performance === 'undefined' ? 0 : performance.now()

const REFERENCE_WIDTH = 1920
const REFERENCE_HEIGHT = 1080
const MINIMUM_RAY_SCALE = 0.55
const MAXIMUM_RAY_SCALE = 1.25
const MAXIMUM_RENDER_SCALE = 0.82
const MAXIMUM_RENDER_PIXELS_PER_LAYER = 600_000
const EDGE_ALPHA_TARGET = 0.05
const ORIGIN_X = 0
const ORIGIN_Y = -1.5
const SOURCE_HALO_ORIGIN_Y = 0
const SOURCE_LAYER_OPACITY = 0.9
const SOURCE_HALO_INTENSITY = 0.9
const SOURCE_HALO_SIZE = 0.07
const SOURCE_CORE_HALO_INTENSITY = 1
const SOURCE_CORE_HALO_SIZE = 0.03
const BREATHING_TIMES = [0, 0.22, 0.34, 0.4, 0.54, 1]

const toGodlightsDirection = (screenAngle: number): number => screenAngle + 90

const raySpecs: readonly RaySpec[] = [
  {
    id: 'far-right-thread',
    direction: toGodlightsDirection(25),
    rayWidth: 7,
    divergence: 4.2,
    fadeEndY: 0.6,
    blur: 6,
    baseOpacity: 0.12,
    peakOpacity: 0.33,
    duration: 67,
    phase: 0.08,
    reducedOpacity: 0.12,
  },
  {
    id: 'right-whisper-thread',
    direction: toGodlightsDirection(35),
    rayWidth: 10,
    divergence: 3.8,
    fadeEndY: 0.63,
    blur: 7,
    baseOpacity: 0.022,
    peakOpacity: 0.27,
    duration: 73,
    phase: 0.46,
    reducedOpacity: 0.022,
  },
  {
    id: 'inner-right-thread',
    direction: toGodlightsDirection(45),
    rayWidth: 6.5,
    divergence: 4.8,
    fadeEndY: 0.52,
    blur: 4.5,
    baseOpacity: 0.025,
    peakOpacity: 0.3,
    duration: 59,
    phase: 0.81,
    reducedOpacity: 0.025,
  },
  {
    id: 'center-anchor-thread',
    direction: toGodlightsDirection(55),
    rayWidth: 9,
    divergence: 4.1,
    fadeEndY: 0.53,
    blur: 6,
    baseOpacity: 0.13,
    peakOpacity: 0.36,
    duration: 79,
    phase: 0.24,
    reducedOpacity: 0.13,
  },
  {
    id: 'reference-anchor-thread',
    direction: toGodlightsDirection(75),
    rayWidth: 8,
    divergence: 4.4,
    fadeEndY: 0.67,
    blur: 6,
    baseOpacity: 0.14,
    peakOpacity: 0.38,
    duration: 83,
    phase: 0.61,
    reducedOpacity: 0.14,
  },
  {
    id: 'inner-left-thread',
    direction: toGodlightsDirection(65),
    rayWidth: 6.5,
    divergence: 5,
    fadeEndY: 0.6,
    blur: 4.5,
    baseOpacity: 0.025,
    peakOpacity: 0.29,
    duration: 61,
    phase: 0.92,
    reducedOpacity: 0.025,
  },
  {
    id: 'left-whisper-thread',
    direction: toGodlightsDirection(82),
    rayWidth: 9,
    divergence: 4,
    fadeEndY: 0.46,
    blur: 6,
    baseOpacity: 0.012,
    peakOpacity: 0.16,
    duration: 71,
    phase: 0.34,
    reducedOpacity: 0.012,
  },
  {
    id: 'outer-right-whisper-thread',
    direction: toGodlightsDirection(18),
    rayWidth: 7,
    divergence: 4.6,
    fadeEndY: 0.48,
    blur: 5,
    baseOpacity: 0.012,
    peakOpacity: 0.16,
    duration: 89,
    phase: 0.74,
    reducedOpacity: 0.012,
  },
]

const layerStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
}

const getInitialViewportSize = (): ViewportSize => {
  if (typeof window === 'undefined') return { width: 1280, height: 720 }

  return {
    width: Math.max(1, Math.round(window.innerWidth)),
    height: Math.max(1, Math.round(window.innerHeight)),
  }
}

const getRayScale = ({ width, height }: ViewportSize): number =>
  Math.max(
    MINIMUM_RAY_SCALE,
    Math.min(
      MAXIMUM_RAY_SCALE,
      Math.min(width / REFERENCE_WIDTH, height / REFERENCE_HEIGHT),
    ),
  )

const getRenderMetrics = ({ width, height }: ViewportSize): RenderMetrics => {
  const viewportPixels = Math.max(1, width * height)
  const scale = Math.min(
    MAXIMUM_RENDER_SCALE,
    Math.sqrt(MAXIMUM_RENDER_PIXELS_PER_LAYER / viewportPixels),
  )

  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    scale,
  }
}

const getRayLength = (
  { width, height }: ViewportSize,
  spec: RaySpec,
): number => {
  const angle = ((spec.direction - 90) * Math.PI) / 180
  const directionX = Math.cos(angle)
  const directionY = Math.sin(angle)
  const originX = (ORIGIN_X / 100) * width
  const originY = (ORIGIN_Y / 100) * height
  const exitDistances = [
    directionX > 0 ? (width - originX) / directionX : -originX / directionX,
    directionY > 0 ? (height - originY) / directionY : -originY / directionY,
  ].filter((distance) => Number.isFinite(distance) && distance > 0)
  const exitDistance = Math.min(...exitDistances)
  const targetY = spec.fadeEndY * height
  const targetDistance = (targetY - originY) / directionY
  const edgeFadeDistance = exitDistance / (1 - EDGE_ALPHA_TARGET)
  const rayDistance = Math.min(targetDistance, edgeFadeDistance)

  return rayDistance / Math.hypot(width, height)
}

const createSourceScene = (renderMetrics: RenderMetrics): SceneConfig => ({
  width: renderMetrics.width,
  height: renderMetrics.height,
  noise: 0,
  grainSize: 1,
  layers: [
    {
      type: 'background',
      bgType: 'solid',
      bgColor: 'rgba(0, 0, 0, 0)',
      bgColor2: 'rgba(0, 0, 0, 0)',
      bgGradientAngle: 0,
    },
    {
      type: 'halo',
      originX: ORIGIN_X,
      originY: SOURCE_HALO_ORIGIN_Y,
      intensity: SOURCE_HALO_INTENSITY,
      size: SOURCE_HALO_SIZE,
      color: '#f7fcff',
      blendMode: 'source-over',
    },
    {
      type: 'halo',
      originX: ORIGIN_X,
      originY: SOURCE_HALO_ORIGIN_Y,
      intensity: SOURCE_CORE_HALO_INTENSITY,
      size: SOURCE_CORE_HALO_SIZE,
      color: '#ffffff',
      blendMode: 'source-over',
    },
  ],
})

const createScene = (
  viewportSize: ViewportSize,
  renderMetrics: RenderMetrics,
  spec: RaySpec,
  index: number,
): SceneConfig => {
  const rayScale = getRayScale(viewportSize) * renderMetrics.scale

  return {
    width: renderMetrics.width,
    height: renderMetrics.height,
    noise: 0,
    grainSize: 1,
    layers: [
      {
        type: 'background',
        bgType: 'solid',
        bgColor: 'rgba(0, 0, 0, 0)',
        bgColor2: 'rgba(0, 0, 0, 0)',
        bgGradientAngle: 0,
      },
      {
        type: 'rays',
        direction: spec.direction,
        spread: 1,
        originX: ORIGIN_X,
        originY: ORIGIN_Y,
        rayCount: 1,
        rayWidth: spec.rayWidth * rayScale,
        divergence: spec.divergence,
        rayLength: getRayLength(renderMetrics, spec),
        opacity: 1,
        blendMode: 'source-over',
        colorStart: '#f6fdff',
        colorEnd: '#f6fdff',
        fadeToTransparent: true,
        blur: spec.blur * rayScale,
        randomnessWidth: 0,
        randomnessLength: 0,
        randomnessAngle: 0,
        seed: 2207 + index * 977,
      },
    ],
  }
}

const getTimelineDelay = (spec: RaySpec): number => {
  if (typeof performance === 'undefined') return -(spec.phase * spec.duration)

  const elapsed = (performance.now() - TIMELINE_STARTED_AT) / 1000
  const timelinePosition =
    (elapsed + spec.phase * spec.duration) % spec.duration

  return -timelinePosition
}

const SummerGodlightRays = () => {
  const reduceMotion = useReducedMotion() === true
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [viewportSize, setViewportSize] = React.useState<ViewportSize>(
    getInitialViewportSize,
  )

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let resizeFrame = 0
    const updateSize = (width: number, height: number) => {
      window.cancelAnimationFrame(resizeFrame)
      resizeFrame = window.requestAnimationFrame(() => {
        const nextSize = {
          width: Math.max(1, Math.round(width)),
          height: Math.max(1, Math.round(height)),
        }

        setViewportSize((currentSize) => {
          if (
            currentSize.width === nextSize.width &&
            currentSize.height === nextSize.height
          ) {
            return currentSize
          }

          return nextSize
        })
      })
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      updateSize(entry.contentRect.width, entry.contentRect.height)
    })
    const initialBounds = container.getBoundingClientRect()

    updateSize(initialBounds.width, initialBounds.height)
    observer.observe(container)

    return () => {
      window.cancelAnimationFrame(resizeFrame)
      observer.disconnect()
    }
  }, [])

  const renderMetrics = React.useMemo(
    () => getRenderMetrics(viewportSize),
    [viewportSize],
  )

  const scenes = React.useMemo(
    () =>
      raySpecs.map((spec, index) =>
        createScene(viewportSize, renderMetrics, spec, index),
      ),
    [renderMetrics, viewportSize],
  )
  const sourceScene = React.useMemo(
    () => createSourceScene(renderMetrics),
    [renderMetrics],
  )

  return (
    <div
      ref={containerRef}
      data-godlights-canvas-count={raySpecs.length + 1}
      data-godlights-layer-count={raySpecs.length}
      data-godlights-origin={`${ORIGIN_X},${ORIGIN_Y}`}
      data-godlights-render-size={`${renderMetrics.width}x${renderMetrics.height}`}
      data-godlights-source-core-size={SOURCE_CORE_HALO_SIZE}
      data-godlights-source-halo="dedicated-source"
      style={layerStyle}
    >
      <div
        data-godlights-source-layer="dedicated-source"
        style={{
          ...layerStyle,
          mixBlendMode: 'screen',
          opacity: SOURCE_LAYER_OPACITY,
        }}
      >
        <GodLights scene={sourceScene} style={layerStyle} />
      </div>
      {raySpecs.map((spec, index) => (
        <motion.div
          key={spec.id}
          animate={
            reduceMotion
              ? { opacity: spec.reducedOpacity }
              : {
                  opacity: [
                    spec.baseOpacity,
                    spec.baseOpacity,
                    spec.peakOpacity,
                    spec.peakOpacity * 0.92,
                    spec.baseOpacity,
                    spec.baseOpacity,
                  ],
                }
          }
          data-godlights-direction={spec.direction}
          data-godlights-fade-end-y={spec.fadeEndY}
          data-godlights-ray={spec.id}
          initial={false}
          style={{
            ...layerStyle,
            mixBlendMode: 'screen',
            willChange: reduceMotion ? undefined : 'opacity',
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  delay: getTimelineDelay(spec),
                  duration: spec.duration,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  times: BREATHING_TIMES,
                }
          }
        >
          <GodLights scene={scenes[index]} style={layerStyle} />
        </motion.div>
      ))}
    </div>
  )
}

export default SummerGodlightRays
