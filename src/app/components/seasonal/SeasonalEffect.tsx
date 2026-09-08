import React from 'react'
import { Snowfall } from 'react-snowfall'

import { THEME, useDarkmodeContext } from '@/context/ThemeContext'

const effectStyle: React.CSSProperties = {
  zIndex: 2,
  position: 'fixed',
  width: '100vw',
  height: '100vh',
  pointerEvents: 'none',
}

const SummerLensFlareEffect = React.lazy(
  () => import('./SummerLensFlareEffect'),
)

const createImage = (src: string): HTMLImageElement => {
  const image = document.createElement('img')
  image.src = src

  return image
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
  const springImages = React.useMemo(
    () => [
      createImage('/image/flower_pink.png'),
      createImage('/image/flower_bpink.png'),
    ],
    [],
  )
  const autumnImages = React.useMemo(
    () => [
      createImage('/image/autumn_orange.svg'),
      createImage('/image/autumn_brown.svg'),
    ],
    [],
  )

  if (!seasonalThemeEnabled) return null

  if (effectTheme === THEME.SPRING) {
    return (
      <Snowfall
        images={springImages}
        snowflakeCount={18}
        wind={[-0.3, 0.8]}
        radius={[14.0, 16.0]}
        speed={[0.5, 1.0]}
        style={effectStyle}
      />
    )
  }

  if (effectTheme === THEME.SUMMER) {
    return (
      <React.Suspense fallback={null}>
        <SummerLensFlareEffect />
      </React.Suspense>
    )
  }

  if (effectTheme === THEME.AUTUMN) {
    return (
      <Snowfall
        images={autumnImages}
        snowflakeCount={18}
        wind={[-0.8, 1.2]}
        radius={[14.0, 16.0]}
        speed={[0.6, 1.2]}
        style={effectStyle}
      />
    )
  }

  if (effectTheme === THEME.WINTER || effectTheme === THEME.CHRISTMAS) {
    return (
      <Snowfall
        color={effectTheme === THEME.CHRISTMAS ? '#fff7ed' : '#cfd8f4'}
        snowflakeCount={effectTheme === THEME.CHRISTMAS ? 36 : 28}
        wind={[-0.5, 0.5]}
        style={effectStyle}
      />
    )
  }

  return null
}

export default SeasonalEffect
