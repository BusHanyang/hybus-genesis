import { classed } from '@tw-classed/react'
import React from 'react'

export type NightSeason =
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'christmas'

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

const STARS = [
  [62, 10, 1.8],
  [96, 34, 1.4],
  [24, 64, 1.6],
  [118, 12, 1.2],
  [300, 10, 1.6],
  [352, 8, 1.3],
  [378, 70, 1.8],
  [242, 6, 1.2],
  [8, 120, 1.3],
  [382, 128, 1.5],
  [6, 300, 1.2],
  [384, 340, 1.4],
  [10, 520, 1.3],
  [380, 560, 1.2],
].map(([x, y, size], i) => {
  const random = seeded(90 + i * 7)
  const duration = 2.6 + random() * 2.8
  return {
    left: `${((x / 390) * 100).toFixed(2)}%`,
    top: `${((y / 844) * 100).toFixed(2)}%`,
    size,
    duration,
    delay: -random() * duration,
  }
})

const FIREFLIES = (() => {
  const random = seeded(777)
  const zones = [
    [2, 30, 110, 720],
    [360, 388, 110, 720],
    [40, 350, 752, 836],
  ]
  return Array.from({ length: 12 }, (_, i) => {
    const [x0, x1, y0, y1] = zones[i % 3]
    const x = x0 + random() * (x1 - x0)
    const y = y0 + random() * (y1 - y0)
    const sign = () => (random() < 0.5 ? -1 : 1)
    const offset = (min: number, span: number) =>
      `${(sign() * (min + random() * span)).toFixed(0)}px`
    const drift = 7 + random() * 7
    const blink = 2.4 + random() * 2.8
    const size = 3.6 + random() * 2.2
    return {
      left: `${((x / 390) * 100).toFixed(2)}%`,
      top: `${((y / 844) * 100).toFixed(2)}%`,
      fx1: offset(10, 22),
      fy1: offset(8, 18),
      fx2: offset(10, 22),
      fy2: offset(8, 18),
      drift,
      driftDelay: -random() * drift,
      blink,
      blinkDelay: -random() * blink,
      size,
    }
  })
})()

const Sky = classed('div', 'absolute inset-0')
const Halo = classed('span', 'absolute rounded-full', {
  variants: {
    'data-season': {
      spring:
        'hb-halo-spring left-[-110px] top-[-108px] h-[280px] w-[280px] animate-[hb-moon-glow_10s_ease-in-out_infinite]',
      summer:
        'hb-halo-summer left-[-92px] top-[-90px] h-60 w-60 animate-[hb-moon-glow_9s_ease-in-out_infinite]',
      autumn:
        'hb-halo-autumn left-[-106px] top-[-106px] h-[290px] w-[290px] animate-[hb-moon-glow_9s_ease-in-out_infinite]',
      winter:
        'hb-halo-winter left-[-90px] top-[-92px] h-[230px] w-[230px] animate-[hb-moon-glow_11s_ease-in-out_infinite]',
      christmas:
        'hb-halo-christmas left-[-104px] top-[-104px] h-[264px] w-[264px] animate-[hb-star-light_4s_ease-in-out_infinite]',
    },
  },
})
const Moon = classed('span', 'absolute rounded-full', {
  variants: {
    'data-season': {
      spring: 'hb-moon-spring left-[13px] top-[13px] h-[34px] w-[34px]',
      summer: 'hb-moon-summer left-4 top-4 h-[30px] w-[30px]',
      autumn: 'hb-moon-autumn left-3 top-3 h-11 w-11',
      winter: 'hb-moon-winter left-[19px] top-[17px] h-[22px] w-[22px]',
    },
  },
})
const TreeStar = classed(
  'span',
  'hb-tree-star absolute left-[11px] top-[9px] h-[42px] w-[42px]',
)
const TreeStarShape = classed('span', 'hb-tree-star-shape absolute inset-0')
const TreeStarGlint = classed(
  'span',
  'hb-tree-star-glint absolute left-[17px] top-[3px] h-2 w-2 rounded-full animate-[hb-star-glint_5.5s_ease-in-out_infinite]',
)
const Star = classed(
  'span',
  'absolute rounded-full bg-[#fff4d2] shadow-[0_0_4px_rgba(255,236,180,.6)] animate-[hb-star-twinkle_ease-in-out_infinite]',
)
const FireflyPath = classed(
  'span',
  'absolute animate-[hb-firefly-drift_ease-in-out_infinite]',
)
const Firefly = classed(
  'span',
  'block rounded-full bg-[#ffeb8a] shadow-[0_0_6px_2px_rgba(255,222,110,.75),0_0_16px_6px_rgba(255,200,80,.25)] animate-[hb-firefly-blink_ease-in-out_infinite]',
)

const NightSky = (props: { season: NightSeason }) => {
  const { season } = props

  return (
    <Sky aria-hidden="true">
      <Halo data-season={season} />
      {season === 'christmas' ? (
        <TreeStar>
          <TreeStarShape />
          <TreeStarGlint />
        </TreeStar>
      ) : (
        <Moon data-season={season} />
      )}
      {season === 'summer' && (
        <>
          {STARS.map((star, i) => (
            <Star
              key={i}
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                animationDuration: `${star.duration.toFixed(1)}s`,
                animationDelay: `${star.delay.toFixed(1)}s`,
              }}
            />
          ))}
          {FIREFLIES.map((fly, i) => (
            <FireflyPath
              key={i}
              style={
                {
                  left: fly.left,
                  top: fly.top,
                  '--fx1': fly.fx1,
                  '--fy1': fly.fy1,
                  '--fx2': fly.fx2,
                  '--fy2': fly.fy2,
                  animationDuration: `${fly.drift.toFixed(1)}s`,
                  animationDelay: `${fly.driftDelay.toFixed(1)}s`,
                } as React.CSSProperties
              }
            >
              <Firefly
                style={{
                  width: fly.size,
                  height: fly.size,
                  animationDuration: `${fly.blink.toFixed(1)}s`,
                  animationDelay: `${fly.blinkDelay.toFixed(1)}s`,
                }}
              />
            </FireflyPath>
          ))}
        </>
      )}
    </Sky>
  )
}

export default NightSky
