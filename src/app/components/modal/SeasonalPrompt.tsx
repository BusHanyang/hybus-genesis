import { classed } from '@tw-classed/react'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { THEME, useDarkmodeContext } from '@/context/ThemeContext'

type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'christmas'

const PARTICLES: Array<[number, number, number, number, number, number]> = [
  [8, 4.6, -1.2, 14, 160, 16],
  [22, 5.8, -3.9, 20, -220, 18],
  [37, 4.2, -0.6, 12, 190, 14],
  [52, 6.4, -2.7, 24, -150, 19],
  [66, 5.1, -4.4, 16, 260, 15],
  [80, 4.8, -2.1, 18, -180, 17],
  [93, 6.0, -0.3, 13, 210, 16],
]

const PARTICLE_IMAGES: Partial<Record<Season, [string, string]>> = {
  spring: ['/image/flower_pink.png', '/image/flower_bpink.png'],
  autumn: ['/image/autumn_orange.svg', '/image/autumn_brown.svg'],
}

const seasonOf = (theme: THEME): Season =>
  theme === THEME.SPRING ||
  theme === THEME.SUMMER ||
  theme === THEME.AUTUMN ||
  theme === THEME.WINTER ||
  theme === THEME.CHRISTMAS
    ? theme
    : 'spring'

const Preview = classed(
  'div',
  'relative h-[150px] overflow-hidden rounded-[18px] bg-theme-main text-theme-text animate-[hb-rise_.45s_cubic-bezier(.2,.8,.2,1)_.06s_backwards]',
  {
    variants: {
      'data-season': {
        spring: 'spring',
        summer: 'summer',
        autumn: 'autumn',
        winter: 'winter',
        christmas: 'christmas',
      },
    },
  },
)
const SeasonBadge = classed(
  'span',
  'absolute left-3 top-3 z-1 flex h-6 items-center rounded-xl bg-button-active px-2.5 text-[12.5px] font-extrabold text-button-active-ink',
)
const PreviewTitle = classed(
  'span',
  'absolute inset-x-0 top-4 text-center text-[15px] font-extrabold',
)
const PreviewCard = classed(
  'span',
  'absolute inset-x-[22px] top-[52px] flex h-20 flex-col justify-center gap-3.5 rounded-[14px] bg-theme-card px-[18px] shadow-theme-shadow',
)
const PreviewRow = classed('span', 'flex items-center gap-3')
const PreviewChip = classed('span', 'h-4 w-10 rounded-lg', {
  variants: {
    tone: {
      direct: 'bg-chip-blue',
      cycle: 'bg-chip-red',
    },
  },
})
const PreviewBar = classed('span', 'h-2 rounded bg-off', {
  variants: {
    'data-size': {
      long: 'w-[150px] max-w-[60%]',
      short: 'w-[120px] max-w-[48%]',
    },
  },
})
const SunGlow = classed(
  'span',
  'absolute -left-12 -top-14 h-[150px] w-[150px] rounded-full bg-[radial-gradient(circle,#ffffff_0%,rgba(255,255,255,.9)_14%,rgba(247,252,255,.45)_32%,rgba(247,252,255,0)_70%)]',
)
const ParticleFall = classed(
  'span',
  'pointer-events-none absolute top-0 animate-[hb-fall-short_linear_infinite]',
)
const ParticleSway = classed(
  'span',
  'block animate-[hb-sway_2.4s_ease-in-out_infinite_alternate]',
)
const ParticleImage = classed('img', 'block drag-save-n')
const SnowDot = classed('span', 'block rounded-full', {
  variants: {
    'data-season': {
      winter: 'bg-[#cfd8f4]',
      christmas: 'bg-[#fff7ed]',
    },
  },
})
const Description = classed(
  'p',
  'm-0 mt-4 text-[15px] leading-[1.6] animate-[hb-rise_.45s_cubic-bezier(.2,.8,.2,1)_.12s_backwards] hsm:text-sm',
)
const Hint = classed(
  'p',
  'm-0 mt-2 text-[13.5px] leading-normal text-ink-2 animate-[hb-rise_.45s_cubic-bezier(.2,.8,.2,1)_.16s_backwards]',
)
const EnableButton = classed(
  'button',
  'mt-[18px] h-14 w-full rounded-2xl bg-theme-text text-[16.5px] font-extrabold text-theme-card transition-[scale] duration-150 active:scale-[.98] animate-[hb-rise_.45s_cubic-bezier(.2,.8,.2,1)_.2s_backwards]',
)
const KeepOffButton = classed(
  'button',
  'mt-1.5 h-[46px] w-full rounded-[14px] text-[14.5px] font-bold text-ink-2 transition-[scale] duration-150 active:scale-[.98] animate-[hb-rise_.45s_cubic-bezier(.2,.8,.2,1)_.24s_backwards]',
)

const Particles = (props: { season: Season }) => {
  const images = PARTICLE_IMAGES[props.season]

  if (props.season === 'summer') return <SunGlow aria-hidden="true" />

  return (
    <>
      {PARTICLES.map(([left, fall, delay, sway, spin, size], i) => (
        <ParticleFall
          key={i}
          aria-hidden="true"
          style={{
            left: `${left}%`,
            animationDuration: `${fall}s`,
            animationDelay: `${delay}s`,
          }}
        >
          <ParticleSway
            style={
              {
                '--dx': `${sway}px`,
                '--rot': `${spin}deg`,
                animationDelay: `${delay / 2}s`,
              } as React.CSSProperties
            }
          >
            {images ? (
              <ParticleImage
                src={images[i % 2]}
                alt=""
                draggable="false"
                style={{ width: size, height: size }}
              />
            ) : (
              <SnowDot
                data-season={props.season === 'christmas' ? 'christmas' : 'winter'}
                style={{ width: size / 3, height: size / 3 }}
              />
            )}
          </ParticleSway>
        </ParticleFall>
      ))}
    </>
  )
}

const SeasonalPrompt = (props: {
  onEnable: (origin: Element | null) => void
  onKeepOff: () => void
}) => {
  const { t } = useTranslation()
  const { automaticSeasonTheme } = useDarkmodeContext()
  const season = seasonOf(automaticSeasonTheme)

  return (
    <>
      <Preview aria-hidden="true" data-season={season}>
        <SeasonBadge>
          {t('seasonal_now', { season: t(`theme_${season}`) })}
        </SeasonBadge>
        <PreviewTitle>{t('title')}</PreviewTitle>
        <PreviewCard>
          <PreviewRow>
            <PreviewChip tone="direct" />
            <PreviewBar data-size="long" />
          </PreviewRow>
          <PreviewRow>
            <PreviewChip tone="cycle" />
            <PreviewBar data-size="short" />
          </PreviewRow>
        </PreviewCard>
        <Particles season={season} />
      </Preview>
      <Description>{t('seasonal_prompt_text')}</Description>
      <Hint>{t('seasonal_prompt_once')}</Hint>
      <EnableButton
        type="button"
        onClick={(e) => props.onEnable(e.currentTarget)}
      >
        {t('seasonal_prompt_enable')}
      </EnableButton>
      <KeepOffButton type="button" onClick={props.onKeepOff}>
        {t('seasonal_prompt_keep')}
      </KeepOffButton>
    </>
  )
}

export default SeasonalPrompt
