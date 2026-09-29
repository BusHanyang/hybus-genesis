import { classed } from '@tw-classed/react'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SnowfallCanvas, type SnowfallCanvasConfig } from 'react-snowfall'

import { THEME, useDarkmodeContext } from '@/context/ThemeContext'

import NightSky, { NightSeason } from './NightSky'

const SummerLensFlareEffect = React.lazy(
  () => import('./SummerLensFlareEffect'),
)

// How long a layer that is switching off keeps fading out.
const FADE_OUT_MS = 450

/*
  Each kind of effect lives in its own full-screen layer with a
  view-transition-name. During the theme reveal the layers are left out of
  the page snapshot and stay live (see index.css), so falling particles never
  freeze in the old snapshot, and effects that switch on or off fade instead
  of popping. The layers stay mounted even when empty: removing a named
  element mid-transition makes the browser cut the reveal short.
*/
const EffectLayer = classed(
  'div',
  'pointer-events-none inset-0 overflow-hidden',
  {
    variants: {
      'data-layer': {
        // Falling particles are skipped when the user prefers less motion.
        particles: 'hb-fx fixed z-2 [view-transition-name:hb-fx]',
        sun: 'fixed z-2 [view-transition-name:hb-sun]',
        // The night sky belongs to the top of the page: the moon stays up
        // there when the page scrolls, and the full timetable covers it.
        night: 'absolute z-[1] [view-transition-name:hb-moon]',
      },
    },
  },
)
const FadeSlot = classed('div', 'absolute inset-0', {
  variants: {
    'data-leaving': {
      true: 'animate-[hb-fade-out_.45s_ease_both]',
      false: 'animate-[hb-fade_.9s_ease_both]',
    },
  },
  defaultVariants: {
    'data-leaving': 'false',
  },
})

type Slot = { id: number; value: string; leaving: boolean }

/**
 * Keeps the previous value around (marked as leaving) for FADE_OUT_MS after
 * it changes, so the old effect can fade out while the new one fades in.
 */
const useFadeSlots = (value: string | null): Array<Slot> => {
  const [state, setState] = useState<{ value: string | null; slots: Slot[] }>(
    () => ({
      value,
      slots: value === null ? [] : [{ id: 0, value, leaving: false }],
    }),
  )

  if (state.value !== value) {
    const nextId = state.slots.reduce((max, slot) => Math.max(max, slot.id), 0)
    setState({
      value,
      slots: [
        ...state.slots
          .filter((slot) => !slot.leaving)
          .map((slot) => ({ ...slot, leaving: true })),
        ...(value === null ? [] : [{ id: nextId + 1, value, leaving: false }]),
      ],
    })
  }

  const hasLeaving = state.slots.some((slot) => slot.leaving)
  useEffect(() => {
    if (!hasLeaving) return
    const timer = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        slots: current.slots.filter((slot) => !slot.leaving),
      }))
    }, FADE_OUT_MS)
    return () => window.clearTimeout(timer)
  }, [hasLeaving, state.value])

  return state.slots
}

const ParticleCanvas = classed(
  'canvas',
  'pointer-events-none absolute inset-0 h-full w-full',
)

const createImage = (src: string): HTMLImageElement => {
  const image = document.createElement('img')
  image.src = src

  return image
}

const particleConfig = (season: string): Partial<SnowfallCanvasConfig> => {
  if (season === THEME.SPRING) {
    return {
      images: [
        createImage('/image/flower_pink.png'),
        createImage('/image/flower_bpink.png'),
      ],
      snowflakeCount: 18,
      wind: [-0.3, 0.8],
      radius: [14.0, 16.0],
      speed: [0.5, 1.0],
    }
  }

  if (season === THEME.AUTUMN) {
    return {
      images: [
        createImage('/image/autumn_orange.svg'),
        createImage('/image/autumn_brown.svg'),
      ],
      snowflakeCount: 18,
      wind: [-0.8, 1.2],
      radius: [14.0, 16.0],
      speed: [0.6, 1.2],
    }
  }

  return {
    color: season === THEME.CHRISTMAS ? '#fff7ed' : '#cfd8f4',
    snowflakeCount: season === THEME.CHRISTMAS ? 36 : 28,
    wind: [-0.5, 0.5],
  }
}

/*
  One falling-particle simulation per season, kept for the whole visit.
  Turning the theme off only pauses it, so turning it back on (or coming back
  to the page) carries on from where the leaves were instead of dropping a
  fresh batch in from the top.
*/
const engines = new Map<string, SnowfallCanvas>()

// Restarts the loop from the current positions: without resetting the clock
// the loop would fast-forward by the whole pause and scatter the particles.
const resume = (engine: SnowfallCanvas) => {
  engine.pause()
  Object.assign(engine, { lastUpdate: Date.now() })
  engine.play()
}

const getEffectTheme = (
  theme: THEME,
  manualSeasonalTheme: THEME | null,
  automaticSeasonTheme: THEME,
): THEME => {
  if (theme === THEME.LIGHT || theme === THEME.DARK) {
    return manualSeasonalTheme ?? automaticSeasonTheme
  }

  return theme
}

const Particles = ({ season }: { season: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // A layout effect, so the hand-over happens in the same commit that swaps
  // the canvases: a frame drawn in between would measure the detached canvas
  // as 0×0 and wrap every particle into the corner.
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const fit = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(canvas)

    let engine = engines.get(season)
    if (engine) {
      engine.canvas = canvas
      resume(engine)
    } else {
      engine = new SnowfallCanvas(canvas, particleConfig(season))
      engines.set(season, engine)
    }
    const running = engine

    // A hidden page draws nothing; pause so the particles don't jump ahead
    // when it comes back.
    const handleVisibility = () => {
      if (running.canvas !== canvas) return
      if (document.visibilityState === 'hidden') running.pause()
      else resume(running)
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
      // A newer layer for the same season may have taken the particles over.
      if (running.canvas === canvas) running.pause()
    }
  }, [season])

  return <ParticleCanvas ref={canvasRef} />
}

const SeasonalEffect = () => {
  const {
    theme,
    automaticSeasonTheme,
    seasonalThemeEnabled,
    manualSeasonalTheme,
  } = useDarkmodeContext()
  const effectTheme = getEffectTheme(
    theme,
    manualSeasonalTheme,
    automaticSeasonTheme,
  )
  const dark = theme === THEME.DARK

  // Particles fall in light and dark alike; summer shows the sun by day and a
  // night sky after dark; every other season adds its moon after dark.
  const particles =
    seasonalThemeEnabled && effectTheme !== THEME.SUMMER ? effectTheme : null
  const sun =
    seasonalThemeEnabled && effectTheme === THEME.SUMMER && !dark
      ? effectTheme
      : null
  const night = seasonalThemeEnabled && dark ? effectTheme : null

  const particleSlots = useFadeSlots(particles)
  const sunSlots = useFadeSlots(sun)
  const nightSlots = useFadeSlots(night)

  return (
    <>
      <EffectLayer aria-hidden="true" data-layer="particles">
        {particleSlots.map((slot) => (
          <FadeSlot
            key={slot.id}
            data-leaving={slot.leaving ? 'true' : 'false'}
          >
            <Particles season={slot.value} />
          </FadeSlot>
        ))}
      </EffectLayer>
      <EffectLayer aria-hidden="true" data-layer="sun">
        {sunSlots.map((slot) => (
          <FadeSlot
            key={slot.id}
            data-leaving={slot.leaving ? 'true' : 'false'}
          >
            <React.Suspense fallback={null}>
              <SummerLensFlareEffect />
            </React.Suspense>
          </FadeSlot>
        ))}
      </EffectLayer>
      <EffectLayer aria-hidden="true" data-layer="night">
        {nightSlots.map((slot) => (
          <FadeSlot
            key={slot.id}
            data-leaving={slot.leaving ? 'true' : 'false'}
          >
            <NightSky season={slot.value as NightSeason} />
          </FadeSlot>
        ))}
      </EffectLayer>
    </>
  )
}

export default SeasonalEffect
