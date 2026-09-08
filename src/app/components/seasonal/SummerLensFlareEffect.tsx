import React from 'react'

import { THEME, useDarkmodeContext } from '@/context/ThemeContext'

import SummerGodlightRays from './godlights/SummerGodlightRays'
import OpticalLensFlare, {
  type OpticalLensFlareProps,
} from './lens-flare/OpticalLensFlare'

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 2,
  width: '100vw',
  height: '100dvh',
  overflow: 'hidden',
  pointerEvents: 'none',
}

const lensStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  mixBlendMode: 'normal',
  opacity: 0.9,
  pointerEvents: 'none',
}

const lensFlareOptions = {
  ghosts: {
    apertureSides: 8,
    breathe: 0,
    chroma: 0.026,
    colorA: '#fff2cf',
    colorB: '#7be5ff',
    count: 18,
    drift: 1.72,
    driftSpeed: 1 / 96,
    edgeSoftness: 0.042,
    fadeVariation: 0.58,
    intensity: 4.4,
    ringIntensity: 1.2,
    scale: 1,
    scatter: 0.018,
    spread: 0.74,
  },
  intensity: 1,
  maxDpr: 1.25,
  motion: { mode: 'static', persistAcrossMounts: true },
  opticalCenter: { x: 0.5, y: 0.5 },
  rays: { intensity: 0 },
  resolutionScale: 0.64,
  source: { x: 0, y: 0 },
  sourceStyle: { coreIntensity: 0, haloIntensity: 0 },
  streak: { intensity: 0 },
  style: lensStyle,
} satisfies OpticalLensFlareProps

const SummerLensFlareEffect = () => {
  const { theme } = useDarkmodeContext()

  if (theme === THEME.DARK) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      data-lens-flare-candidate="godlights-with-optical-ghosts"
      style={overlayStyle}
    >
      <SummerGodlightRays />
      <OpticalLensFlare {...lensFlareOptions} />
    </div>
  )
}

export default SummerLensFlareEffect
