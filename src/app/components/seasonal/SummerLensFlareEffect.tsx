import React from 'react'

import { THEME, useDarkmodeContext } from '@/context/ThemeContext'

import SummerGodlightRays from './godlights/SummerGodlightRays'
import OpticalLensFlare from './lens-flare/OpticalLensFlare'

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
      <OpticalLensFlare
        ghosts={{
          apertureSides: 8,
          breathe: 0,
          chroma: 0.004,
          colorA: '#d8f5ff',
          colorB: '#9edff4',
          count: 18,
          drift: 1.72,
          driftSpeed: 1 / 96,
          edgeSoftness: 0.14,
          fadeVariation: 0.95,
          intensity: 5,
          ringIntensity: 0.025,
          scale: 1,
          scatter: 0.025,
          spread: 1,
        }}
        intensity={1}
        maxDpr={1.5}
        motion={{ mode: 'static', persistAcrossMounts: true }}
        opticalCenter={{ x: 0.5, y: 0.5 }}
        rays={{ intensity: 0 }}
        resolutionScale={0.82}
        source={{ x: 0, y: 0 }}
        sourceStyle={{ coreIntensity: 0, haloIntensity: 0 }}
        streak={{ intensity: 0 }}
        style={lensStyle}
      />
    </div>
  )
}

export default SummerLensFlareEffect
