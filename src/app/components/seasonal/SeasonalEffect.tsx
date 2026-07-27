import { classed } from '@tw-classed/react'
import React from 'react'
import { Snowfall } from 'react-snowfall'

import {
  getAutomaticSeasonTheme,
  THEME,
  useDarkmodeContext,
} from '@/context/ThemeContext'

const effectStyle: React.CSSProperties = {
  zIndex: 2,
  position: 'fixed',
  width: '100vw',
  height: '100vh',
  pointerEvents: 'none',
}

const getEffectStyle = (visible: boolean): React.CSSProperties => ({
  ...effectStyle,
  opacity: visible ? 1 : 0,
})

const SUMMER_RAIN_DROP_COUNT = 14

const createImage = (src: string): HTMLImageElement => {
  const image = document.createElement('img')
  image.src = src

  return image
}

const getEffectTheme = (
  theme: THEME,
  manualSeasonalTheme: THEME | null,
): THEME => {
  if (theme === THEME.LIGHT || theme === THEME.DARK) {
    return manualSeasonalTheme ?? getAutomaticSeasonTheme()
  }

  return theme
}

const SummerRainLayer = classed(
  'div',
  'pointer-events-none fixed inset-0 z-[2] overflow-hidden transition-opacity duration-300',
  {
    variants: {
      'data-state': {
        visible: 'opacity-100',
        hidden: 'opacity-0',
      },
    },
    defaultVariants: {
      'data-state': 'hidden',
    },
  },
)
const SummerRainDrop = classed(
  'span',
  'summer-rain-drop absolute -top-20 h-16 w-px rounded-full bg-sky-400/35 shadow-[0_0_5px_rgba(56,189,248,0.16)]',
)

const SummerRainEffect = ({ visible }: { visible: boolean }) => (
  <SummerRainLayer data-state={visible ? 'visible' : 'hidden'}>
    {Array.from({ length: SUMMER_RAIN_DROP_COUNT }, (_, index) => (
      <SummerRainDrop key={index} />
    ))}
  </SummerRainLayer>
)

const SeasonalEffect = () => {
  const {
    theme,
    seasonalThemeEnabled,
    manualSeasonalTheme,
    seasonalThemePreview,
  } = useDarkmodeContext()
  const effectTheme = getEffectTheme(theme, manualSeasonalTheme)
  const effectVisible = seasonalThemeEnabled || seasonalThemePreview
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

  const style = getEffectStyle(effectVisible)

  if (effectTheme === THEME.SPRING) {
    return (
      <Snowfall
        images={springImages}
        snowflakeCount={18}
        wind={[-0.3, 0.8]}
        radius={[14.0, 16.0]}
        speed={[0.5, 1.0]}
        style={style}
      />
    )
  }

  if (effectTheme === THEME.SUMMER) {
    return <SummerRainEffect visible={effectVisible} />
  }

  if (effectTheme === THEME.AUTUMN) {
    return (
      <Snowfall
        images={autumnImages}
        snowflakeCount={18}
        wind={[-0.8, 1.2]}
        radius={[14.0, 16.0]}
        speed={[0.6, 1.2]}
        style={style}
      />
    )
  }

  if (effectTheme === THEME.WINTER || effectTheme === THEME.CHRISTMAS) {
    return (
      <Snowfall
        color={effectTheme === THEME.CHRISTMAS ? '#fff7ed' : '#cfd8f4'}
        snowflakeCount={effectTheme === THEME.CHRISTMAS ? 36 : 28}
        wind={[-0.5, 0.5]}
        style={style}
      />
    )
  }

  return null
}

export default SeasonalEffect
