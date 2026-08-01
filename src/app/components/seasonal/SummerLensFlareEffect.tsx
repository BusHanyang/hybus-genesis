import React from 'react'

import SummerGodlightRays from './godlights/SummerGodlightRays'

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 2,
  width: '100vw',
  height: '100dvh',
  overflow: 'hidden',
  pointerEvents: 'none',
}

const SummerLensFlareEffect = () => (
  <div
    aria-hidden="true"
    data-lens-flare-candidate="godlights-breathing-wedges"
    style={overlayStyle}
  >
    <SummerGodlightRays />
  </div>
)

export default SummerLensFlareEffect
