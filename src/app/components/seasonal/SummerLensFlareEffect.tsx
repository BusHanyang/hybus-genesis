import { Canvas, useThree } from '@react-three/fiber'
import { EffectComposer, LensFlareEffect } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import React from 'react'
import { Color, Vector2, Vector3 } from 'three'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 2,
  pointerEvents: 'none',
  mixBlendMode: 'screen',
  opacity: 1,
}

const flareColor = new Color(1.8, 2.1, 2.7)
const transparentFlareColor = new Color(0, 0, 0)
const flarePosition = new Vector3(-0.98, 0.98, 0)
const densityFlarePosition = flarePosition.clone().multiplyScalar(0.62)

const usePrefersReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
  )

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    mediaQuery.addEventListener('change', updatePreference)

    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return prefersReducedMotion
}

const LensFlareScene = ({
  densityOnly,
  reducedMotion,
}: {
  densityOnly: boolean
  reducedMotion: boolean
}) => {
  const size = useThree((state) => state.size)
  // v3.0.4's JSX wrapper consumes the shader's opacity prop as blend opacity.
  // Keep the exported effect directly until https://github.com/pmndrs/react-postprocessing/issues/334 is fixed.
  const effect = React.useMemo(
    () =>
      new LensFlareEffect({
        aditionalStreaks: false,
        animated: !densityOnly && !reducedMotion,
        anamorphic: false,
        blendFunction: BlendFunction.NORMAL,
        colorGain: densityOnly ? transparentFlareColor : flareColor,
        enabled: true,
        flareShape: 0.14,
        flareSize: densityOnly ? 0 : 0.036,
        flareSpeed: 0,
        ghostScale: densityOnly ? 0.2 : 0.42,
        glareSize: 0.006,
        haloScale: 0.5,
        lensDirtTexture: null,
        lensPosition: densityOnly ? densityFlarePosition : flarePosition,
        opacity: densityOnly ? 0.45 : 0,
        screenRes: new Vector2(1, 1),
        secondaryGhosts: true,
        starBurst: false,
        starPoints: 8,
      }),
    [densityOnly, reducedMotion],
  )

  React.useLayoutEffect(() => {
    const screenResolution = effect.uniforms.get('screenRes')

    screenResolution?.value.set(size.width, size.height)
  }, [effect, size.height, size.width])

  React.useEffect(() => () => effect.dispose(), [effect])

  return (
    <EffectComposer depthBuffer={false} multisampling={0}>
      <primitive dispose={null} object={effect} />
    </EffectComposer>
  )
}

const LensFlareCanvas = ({
  densityOnly,
  reducedMotion,
}: {
  densityOnly: boolean
  reducedMotion: boolean
}) => (
  <Canvas
    aria-hidden="true"
    dpr={[1, 1.5]}
    fallback={null}
    flat
    frameloop={densityOnly || reducedMotion ? 'demand' : 'always'}
    gl={{ alpha: false, antialias: false, powerPreference: 'low-power' }}
    onCreated={({ gl }) => gl.setClearColor(0x000000, 1)}
    style={overlayStyle}
  >
    <LensFlareScene densityOnly={densityOnly} reducedMotion={reducedMotion} />
  </Canvas>
)

const SummerLensFlareEffect = () => {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <>
      <LensFlareCanvas densityOnly={false} reducedMotion={reducedMotion} />
      <LensFlareCanvas densityOnly reducedMotion={reducedMotion} />
    </>
  )
}

export default SummerLensFlareEffect
