import { classed } from '@tw-classed/react'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ChevronImg from '/public/image/chevron_up_24dp.svg?react'
import { useDotAnimation } from '@/components/routemap/DotAnimation'
import RouteVisual, {
  stopKey,
  stopLeft,
} from '@/components/routemap/RouteVisual'
import { useShuttleTimetable } from '@/components/shuttle/useShuttleTimetable'
import { useDarkmodeContext } from '@/context/ThemeContext'
import { RouteAnimationFlag, StopLocation } from '@/data'

type RouteStatus = keyof RouteAnimationFlag

const OPEN_HEIGHT = 238
const MIN_CLOSED_HEIGHT = 56
const CLOSE_UNMOUNT_MS = 300

const routeRows: Array<{ route: RouteStatus; label: string }> = [
  { route: 'direct', label: 'direct' },
  { route: 'cycle', label: 'cycle' },
  { route: 'yesulin', label: 'yesul' },
  { route: 'jungang', label: 'jung' },
]

const headStops: Array<[number, string]> = [
  [0, 'route_head_dorm'],
  [1, 'route_head_shuttlecoke'],
  [2, 'route_head_subway'],
  [4, 'route_head_shuttlecoke'],
  [5, 'route_head_dorm'],
]

const legendItems: Array<{ tone: RouteStatus; label: string }> = [
  { tone: 'cycle', label: 'cycle_index' },
  { tone: 'direct', label: 'direct_index' },
  { tone: 'yesulin', label: 'yesulin_index' },
  { tone: 'jungang', label: 'jungang_index' },
]

const Card = classed(
  'div',
  'relative mt-3 block w-full cursor-default overflow-hidden rounded-[20px] bg-theme-card text-theme-text shadow-theme-shadow outline-none transition-[height,background-color,box-shadow] duration-[450ms] ease-smooth focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
)
// The legend slides up and out as the map opens, and comes back a beat after
// the map has faded when it closes.
const Legend = classed(
  'div',
  'absolute inset-x-0 top-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-3 hm:gap-x-2.5',
  {
    variants: {
      'data-open': {
        true: 'opacity-0 -translate-y-2 [transition:opacity_.25s,translate_.35s]',
        false:
          'opacity-100 translate-y-0 [transition:opacity_.25s_.15s,translate_.35s_.15s]',
      },
    },
    defaultVariants: {
      'data-open': 'false',
    },
  },
)
const LegendItem = classed(
  'span',
  'flex items-center gap-[5px] whitespace-nowrap text-[13px] font-semibold hm:text-xs hsm:text-[11px]',
)
const LegendDot = classed(
  'span',
  "relative inline-block h-2.5 w-2.5 shrink-0 rounded-full",
  {
    variants: {
      tone: {
        cycle: 'bg-chip-red',
        direct: 'bg-chip-blue',
        yesulin: 'bg-chip-green',
        jungang: 'bg-chip-purple',
      },
      // The spring theme turns the legend dots into little blossoms.
      'data-theme': {
        spring:
          "rotate-45 scale-75 rounded-none before:absolute before:left-[-50%] before:top-0 before:h-full before:w-full before:rounded-full before:bg-inherit before:content-[''] after:absolute after:left-0 after:top-[-50%] after:h-full after:w-full after:rounded-full after:bg-inherit after:content-['']",
        default: '',
      },
    },
    defaultVariants: {
      'data-theme': 'default',
    },
  },
)
const MapArea = classed(
  'div',
  'absolute inset-x-4 top-3.5 animate-[hb-fade_.3s_ease_backwards] hm:inset-x-3',
  {
    variants: {
      'data-open': {
        true: 'opacity-100 [transition:opacity_.3s_ease]',
        false: 'opacity-0 [transition:opacity_.15s_ease]',
      },
    },
    defaultVariants: {
      'data-open': 'true',
    },
  },
)
const HeadRow = classed('div', 'flex gap-2.5 animate-map-row hm:gap-2')
const ChipColumn = classed('span', 'w-[60px] shrink-0 hm:w-[52px] hsm:w-[46px]')
const HeadTrack = classed('span', 'relative h-5 grow')
// English stop names are long, so they may wrap onto a second line within
// the gap between two stops (the translations carry break opportunities).
const HeadLabel = classed(
  'span',
  'absolute top-0 -translate-x-1/2 text-center font-bold',
  {
    variants: {
      'data-stop': stopLeft,
      lang: {
        ko: 'whitespace-nowrap text-[13px] hm:text-xs hsm:text-[11px]',
        other:
          'w-max max-w-[22%] text-[11px] leading-[1.05] tracking-tighter hsm:text-[10px]',
      },
    },
  },
)
const MapRow = classed(
  'div',
  'flex h-10 items-center gap-2.5 animate-map-row hm:gap-2',
)
const RouteMethod = classed(
  'span',
  'flex h-[26px] w-[60px] shrink-0 items-center justify-center rounded-[13px] font-bold tracking-tight text-[#111111] hm:w-[52px] hsm:w-[46px]',
  {
    variants: {
      lang: {
        ko: 'text-[13.5px] hm:text-xs hsm:text-[11px]',
        other: 'text-xs tracking-tighter hm:text-[11px] hsm:text-[10px]',
      },
      tone: {
        direct: 'bg-chip-blue',
        cycle: 'bg-chip-red',
        yesulin: 'bg-chip-green',
        jungang: 'bg-chip-purple',
      },
    },
  },
)
const Chevron = classed(
  ChevronImg,
  'absolute bottom-[3px] left-1/2 -ml-[9px] h-[18px] w-[18px] text-ink-3 transition-transform duration-[450ms] ease-smooth',
  {
    variants: {
      'data-open': {
        true: 'rotate-0',
        false: 'rotate-180',
      },
    },
    defaultVariants: {
      'data-open': 'false',
    },
  },
)

const RouteMap = (props: { tab: StopLocation }) => {
  const { t, i18n } = useTranslation()
  const { theme } = useDarkmodeContext()
  const { routeTimetable } = useShuttleTimetable(props.tab)
  const animationFlagTable = useDotAnimation(props.tab, routeTimetable)
  const [open, setOpen] = useState<boolean>(false)
  const [openCount, setOpenCount] = useState<number>(0)
  const [mapMounted, setMapMounted] = useState<boolean>(false)
  const [legendHeight, setLegendHeight] = useState<number>(0)
  const legendRef = useRef<HTMLDivElement>(null)
  const lang = i18n.language === 'ko' ? 'ko' : 'other'

  // The collapsed card hugs the legend, which wraps onto two lines in English
  // on narrow screens.
  useLayoutEffect(() => {
    const element = legendRef.current
    if (element === null) return
    const update = () => setLegendHeight(element.offsetHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Keep the map mounted while it fades out, then drop it so the pings stop.
  useEffect(() => {
    if (open) return
    const timer = window.setTimeout(
      () => setMapMounted(false),
      CLOSE_UNMOUNT_MS,
    )
    return () => window.clearTimeout(timer)
  }, [open])

  const toggle = () => {
    if (!open) {
      setOpenCount((count) => count + 1)
      setMapMounted(true)
    }
    setOpen(!open)
  }

  const closedHeight = Math.max(MIN_CLOSED_HEIGHT, legendHeight + 14)

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-label={t('route_map_toggle')}
      style={{ height: open ? OPEN_HEIGHT : closedHeight }}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      }}
    >
      <Legend
        ref={legendRef}
        aria-hidden={open}
        data-open={open ? 'true' : 'false'}
      >
        {legendItems.map((item) => (
          <LegendItem key={item.tone}>
            <LegendDot
              tone={item.tone}
              data-theme={theme === 'spring' ? 'spring' : 'default'}
            />
            {t(item.label)}
          </LegendItem>
        ))}
      </Legend>

      {mapMounted && (
        <MapArea
          key={openCount}
          aria-hidden={!open}
          data-open={open ? 'true' : 'false'}
        >
          <HeadRow>
            <ChipColumn />
            <HeadTrack>
              {headStops.map(([stop, label]) => (
                <HeadLabel key={stop} lang={lang} data-stop={stopKey(stop)}>
                  {t(label)}
                </HeadLabel>
              ))}
            </HeadTrack>
          </HeadRow>
          {routeRows.map((row, rowIndex) => (
            <MapRow
              key={row.route}
              style={{ animationDelay: `${60 + rowIndex * 60}ms` }}
            >
              <RouteMethod lang={lang} tone={row.route}>
                {t(row.label)}
              </RouteMethod>
              <RouteVisual
                routeStatus={row.route}
                tab={props.tab}
                animationFlagTable={animationFlagTable}
                rowIndex={rowIndex}
              />
            </MapRow>
          ))}
        </MapArea>
      )}

      <Chevron aria-hidden="true" data-open={open ? 'true' : 'false'} />
    </Card>
  )
}

export default RouteMap
