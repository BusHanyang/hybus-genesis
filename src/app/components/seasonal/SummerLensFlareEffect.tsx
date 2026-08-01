import React from 'react'

import OpticalLensFlare, {
  LensFlareGhostStyle,
  LensFlareMotion,
  LensFlarePoint,
  LensFlareRayStyle,
  LensFlareSourceStyle,
  LensFlareStreakStyle,
} from './lens-flare/OpticalLensFlare'

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 2,
  width: '100vw',
  height: '100dvh',
  overflow: 'hidden',
  pointerEvents: 'none',
  mixBlendMode: 'screen',
}

const canvasStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'block',
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
}

const source: LensFlarePoint = { x: 0.5, y: 0 }
const opticalCenter: LensFlarePoint = { x: 0.58, y: 0.62 }

const motion: LensFlareMotion = {
  mode: 'horizontal',
  amplitude: { x: 0.47, y: 0 },
  speed: 1 / 84,
  phase: 0,
  persistAcrossMounts: true,
}

const sourceStyle: LensFlareSourceStyle = {
  coreColor: '#fff9e8',
  haloColor: '#ffdcb3',
  coreRadius: 0.04,
  coreIntensity: 1.7,
  haloRadius: 0.17,
  haloIntensity: 0.15,
}

const rays: LensFlareRayStyle = {
  color: '#c9edff',
  length: 1.04,
  intensity: 0.064,
  count: 6,
  softness: 0.42,
  angle: -0.1,
}

const streak: LensFlareStreakStyle = {
  color: '#bceaff',
  length: 1.08,
  width: 0.0036,
  intensity: 0.17,
  angle: -0.018,
}

const ghosts: LensFlareGhostStyle = {
  colorA: '#ff9875',
  colorB: '#3bd4ff',
  count: 9,
  spread: 1,
  scale: 0.78,
  intensity: 1.08,
  apertureSides: 6,
  chroma: 0.21,
  edgeSoftness: 0.022,
  ringIntensity: 1.02,
  breathe: 0.016,
}

const SummerLensFlareEffect = () => (
  <div
    aria-hidden="true"
    data-lens-flare-candidate="hybus-optical-2d"
    style={overlayStyle}
  >
    <OpticalLensFlare
      ghosts={ghosts}
      intensity={0.9}
      maxDpr={1.5}
      motion={motion}
      motionPreference="system"
      opticalCenter={opticalCenter}
      rays={rays}
      resolutionScale={0.9}
      source={source}
      sourceStyle={sourceStyle}
      streak={streak}
      style={canvasStyle}
    />
  </div>
)

export default SummerLensFlareEffect
