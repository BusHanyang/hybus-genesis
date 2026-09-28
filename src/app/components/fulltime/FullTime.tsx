import { useQuery } from '@tanstack/react-query'
import { classed } from '@tw-classed/react'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'

import BackImg from '/public/image/arrow_back_outline_24dp.svg?react'
import CheckImg from '/public/image/check_outline_24dp.svg?react'
import ChevronImg from '/public/image/chevron_up_24dp.svg?react'
import { useDarkmodeContext } from '@/context/ThemeContext'
import { Season, SingleShuttleSchedule, StopLocation, Week } from '@/data'
import { seasonKeys } from '@/data/shuttle/season'
import { weekKeys } from '@/data/shuttle/week'
import { shuttleAPI } from '@/network'

import { useDarkMode } from '../useDarkMode'
import {
  canAnimateSheet,
  runSheetTransition,
  skipSheetTransition,
} from './sheetTransition'

type GroupKey = 'circle' | 'jungang' | 'directY' | 'direct'
type MinuteState = 'past' | 'next' | 'upcoming'
type HourGroup = {
  key: GroupKey
  tone: 'cycle' | 'jungang' | 'yesulin' | 'direct' | 'orange'
  label: string
  minutes: Array<{ mm: string; state: MinuteState }>
}

// Same grouping as before: 순환, 중앙역, 예술인, then 직행 (orange for the
// dorm-bound R runs).
const GROUP_ORDER: Array<GroupKey> = ['circle', 'jungang', 'directY', 'direct']
const groupOf = (type: string): GroupKey | null => {
  if (type === 'C') return 'circle'
  if (type === 'DHJ') return 'jungang'
  if (type === 'DY') return 'directY'
  if (type === 'DH' || type === 'R' || type === '') return 'direct'
  return null
}

const COMPACT_ON_Y = 240
const COMPACT_OFF_Y = 200
// Matches the closing transition on Sheet.
const CLOSE_MS = 400
// Glide to the next departure once the sheet has finished opening.
const GLIDE_DELAY_MS = 550
const GLIDE_MS = 500

const FULL_CLIP = 'inset(0px 0px 0px 0px)'

// The home button's box as a clip on the sheet (which covers the viewport);
// square, as rounded corners would keep the animation off the compositor.
const buttonClip = (): string | null => {
  const button = document.getElementById('all')
  if (button === null) return null
  const box = button.getBoundingClientRect()
  const width = document.documentElement.clientWidth
  const height = window.innerHeight
  if (box.width === 0 || box.bottom <= 0 || box.top >= height) return null
  return `inset(${box.top}px ${width - box.right}px ${height - box.bottom}px ${box.left}px)`
}

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const themeRootVariants = {
  variants: {
    'data-theme': {
      light: 'light',
      dark: 'dark',
      christmas: 'christmas',
      spring: 'spring',
      summer: 'summer',
      autumn: 'autumn',
      winter: 'winter',
    },
  },
  defaultVariants: {
    'data-theme': 'light',
  },
} as const

const ThemeRoot = classed('div', '', themeRootVariants)
// A full-screen sheet over the home screen (which stays mounted underneath).
// Falling seasonal effects (z-2) still drift over it, as they did before.
// It opens and closes through the home button's box with a view transition
// (sheetTransition.ts); these phases do the same on the live page where that
// isn't available, or when the browser's forward brings the page back.
const Sheet = classed(
  'div',
  'fixed inset-0 z-[1] overflow-hidden bg-ft-page font-Ptd text-theme-text select-none',
  {
    variants: {
      'data-phase': {
        opening: '',
        open: '[transition:clip-path_.5s_cubic-bezier(.25,.5,.25,1),background-color_.35s_ease]',
        // Closing: an even curve with a short tail, so it doesn't hover just
        // above the button, and a late fade so it blends into the button.
        closing:
          'pointer-events-none opacity-0 [transition:clip-path_.4s_cubic-bezier(.6,0,.4,1),opacity_.1s_ease_.3s]',
      },
    },
    defaultVariants: {
      'data-phase': 'opening',
    },
  },
)
const Scroller = classed(
  'div',
  'absolute inset-0 overflow-y-auto overscroll-contain',
)
const Column = classed('div', 'mx-auto max-w-[30rem] px-5 pb-8 text-left')
const Header = classed('header', '-ml-3 flex items-center gap-0.5 pb-1.5 pt-4')
const BackButton = classed(
  'button',
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-[scale] duration-150 active:scale-[.96]',
)
const BackIcon = classed(BackImg, 'h-6 w-6')
const Title = classed('h1', 'm-0 text-[23px] font-extrabold tracking-[-0.03em]')
const FilterGroup = classed(
  'section',
  'border-b border-ft-divider pb-3.5 pt-3 transition-colors duration-[350ms]',
)
const FilterTitle = classed('h2', 'm-0 mb-2.5 text-base font-extrabold')
const FilterChips = classed('div', 'flex flex-wrap gap-2')
const FilterChip = classed(
  'button',
  'flex h-[34px] items-center rounded-[9px] border px-3 text-sm font-semibold transition-[background-color,border-color,color,scale] duration-[250ms] active:scale-[.96] hm:text-[13px]',
  {
    variants: {
      'data-on': {
        true: 'border-ft-active bg-ft-active text-ft-active-text',
        false: 'border-ft-border bg-transparent text-ft-text',
      },
    },
    defaultVariants: {
      'data-on': 'false',
    },
  },
)
// The check mark opens up in front of the selected chip's label.
const CheckWrap = classed(
  'span',
  'inline-flex overflow-hidden transition-[width,margin,opacity] duration-[280ms] ease-smooth',
  {
    variants: {
      'data-on': {
        true: 'mr-1.5 w-4 opacity-100',
        false: 'mr-0 w-0 opacity-0',
      },
    },
    defaultVariants: {
      'data-on': 'false',
    },
  },
)
const CheckIcon = classed(CheckImg, 'h-4 w-4 shrink-0')
const Message = classed(
  'div',
  'py-10 text-center text-[15px] font-semibold text-ink-2 animate-rise',
)
const ErrorButton = classed(
  'button',
  'mt-3 rounded-[10px] bg-press-bg px-3 py-2 text-sm font-semibold text-ink-2',
)
const HourList = classed('div', 'mt-4 flex flex-col gap-2.5')
const SkeletonCard = classed('div', 'hb-skeleton h-24 rounded-[20px]')
const HourCard = classed(
  'div',
  'grid grid-cols-[58px_minmax(0,1fr)] items-center gap-2.5 rounded-[20px] px-4 py-3.5 transition-[background-color,box-shadow] duration-300 hm:grid-cols-[50px_minmax(0,1fr)] hm:px-3',
  {
    variants: {
      'data-now': {
        true: 'bg-ft-hour-now shadow-[inset_0_0_0_1.5px_var(--color-ft-now)]',
        false: 'bg-ft-element',
      },
      'data-enter': {
        true: 'animate-rise',
        false: '',
      },
    },
    defaultVariants: {
      'data-now': 'false',
      'data-enter': 'true',
    },
  },
)
const HourLabel = classed('div', 'flex flex-col items-center gap-[3px]')
const HourText = classed('span', 'text-[17px] font-extrabold tabular-nums')
const NowBadge = classed(
  'span',
  'flex items-center gap-1 text-[11px] font-extrabold text-ft-now',
)
const NowDot = classed(
  'span',
  'h-1.5 w-1.5 rounded-full bg-ft-now animate-blink',
)
const Groups = classed('div', 'flex flex-col gap-2')
const Group = classed(
  'div',
  'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2.5',
)
const GroupChip = classed(
  'span',
  'flex h-6 min-w-[46px] items-center justify-center rounded-xl px-2 text-[13px] font-bold tracking-tight text-[#111111]',
  {
    variants: {
      tone: {
        cycle: 'bg-chip-red',
        jungang: 'bg-chip-purple',
        yesulin: 'bg-chip-green',
        direct: 'bg-chip-blue',
        orange: 'bg-chip-orange',
      },
    },
  },
)
const Minutes = classed('div', 'flex flex-wrap gap-x-[9px] gap-y-[3px] pt-0.5')
const Minute = classed(
  'span',
  'text-[15px] tabular-nums transition-colors duration-300',
  {
    variants: {
      'data-state': {
        past: 'font-semibold text-ft-past',
        next: 'font-extrabold text-ft-now',
        upcoming: 'font-semibold',
      },
    },
    defaultVariants: {
      'data-state': 'upcoming',
    },
  },
)
// Slides down once the filters have scrolled away.
const CompactBar = classed(
  'div',
  'absolute inset-x-0 top-0 z-10 bg-ft-page shadow-[0_1px_0_var(--color-ft-divider),0_6px_16px_rgba(16,24,40,.06)] transition-[translate,opacity] duration-[350ms] ease-smooth',
  {
    variants: {
      'data-visible': {
        true: 'translate-y-0 opacity-100',
        false: 'pointer-events-none -translate-y-[110%] opacity-0',
      },
    },
    defaultVariants: {
      'data-visible': 'false',
    },
  },
)
const CompactInner = classed(
  'div',
  'mx-auto flex h-[58px] max-w-[30rem] items-center gap-1 pl-2 pr-4',
)
const CompactTitle = classed(
  'span',
  'shrink-0 text-[17px] font-extrabold tracking-[-0.02em]',
)
const SummaryButton = classed(
  'button',
  'ml-auto flex h-8 min-w-0 items-center gap-1 rounded-2xl bg-ft-active px-3 text-[13px] font-bold text-ft-active-text transition-[scale] duration-150 active:scale-[.96]',
)
const SummaryText = classed('span', 'truncate')
const UpIcon = classed(ChevronImg, 'h-3.5 w-3.5 shrink-0 stroke-[2.4]')

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
const clockNow = () => {
  const now = new Date()
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

const openApiMonitor = () => {
  window.open(
    'https://monitor.hybus.app/status/bushanyang',
    '_blank',
    'noopener noreferrer',
  )
}

type FullTimeProps = {
  // Open out of the home button (not on a direct visit or a browser swipe).
  animateOpen: boolean
  // The page has been left: close back into the button, then onClosed.
  closing: boolean
  onBack: () => void
  onClosed: () => void
}

const FullTime = (props: FullTimeProps) => {
  const { animateOpen, closing, onBack, onClosed } = props
  const [season, setSeason] = useState<Season>(
    (window.localStorage.getItem('season') as Season) || 'semester',
  )
  const [week, setWeek] = useState<Week>(
    (window.localStorage.getItem('week') as Week) || 'week',
  )
  const [location, setLocation] = useState<StopLocation>(
    (window.localStorage.getItem('tab') as StopLocation) || 'shuttlecoke_o',
  )
  // The home screen saves today's season and week, so those are "today".
  const [today] = useState(() => ({
    season: window.localStorage.getItem('season') || 'semester',
    week: window.localStorage.getItem('week') || 'week',
  }))
  const [clock, setClock] = useState<string>(clockNow)
  const [compact, setCompact] = useState<boolean>(false)
  // Start clipped to the home button from the very first style the sheet
  // gets, so the reveal starts there (not from a placeholder).
  const [openFrom] = useState<string | null>(() =>
    animateOpen && !prefersReducedMotion() ? buttonClip() : null,
  )
  const [closeTo, setCloseTo] = useState<string | null>(null)
  const [phase, setPhase] = useState<'opening' | 'open' | 'closing'>(
    openFrom === null ? 'open' : 'opening',
  )
  const clipPath =
    (phase === 'opening' ? openFrom : phase === 'closing' ? closeTo : null) ??
    FULL_CLIP
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const touchedRef = useRef<boolean>(false)
  const scrolledToTargetRef = useRef<boolean>(false)
  const targetCardRef = useRef<HTMLDivElement>(null)
  const timetable = useQuery({
    queryKey: ['fullTime', season, week, location],
    queryFn: async () => await shuttleAPI(season, week, location),
    staleTime: 5 * 60 * 1000,
  })
  // The list the page opens with, when it comes straight from the cache, is
  // revealed along with the page; lists that load or are picked later rise in.
  const listKey = `${location}-${season}-${week}`
  const [openedListKey, setOpenedListKey] = useState<string | null>(() =>
    timetable.data !== undefined ? listKey : null,
  )
  const cardsEnter = listKey !== openedListKey
  const { theme } = useDarkmodeContext()
  const { setBackground } = useDarkMode()
  const { t } = useTranslation()

  useLayoutEffect(() => {
    setBackground()
  })

  useEffect(() => {
    if (season === seasonKeys.HALT) {
      setSeason(seasonKeys.SEMESTER)
    }

    if (week === weekKeys.UNKNOWN) {
      setWeek(weekKeys.WEEK)
    }
  }, [season, week])

  // Keep "now" and the next departure current while the page stays open.
  useEffect(() => {
    const timer = window.setInterval(() => setClock(clockNow()), 15000)
    return () => window.clearInterval(timer)
  }, [])

  // Open: reveal the page out of the home button. Reading the layout first
  // settles the button's clip as the starting point, so the transition
  // starts before the first paint instead of waiting for frames (which a
  // throttled or hidden page may not deliver).
  useLayoutEffect(() => {
    if (openFrom === null) return
    // Back while a snapshot is still shrinking (browser forward): drop it so
    // the page grows again from the button instead.
    skipSheetTransition()
    sheetRef.current?.getBoundingClientRect()
    setPhase((current) => (current === 'opening' ? 'open' : current))
  }, [openFrom])

  // Close: shrink back into the home button, then let the page go. Coming
  // back before that (browser forward) opens it again.
  useEffect(() => {
    if (!closing) {
      setPhase((current) => (current === 'closing' ? 'open' : current))
      return
    }
    // Like the theme switch: a snapshot of the page shrinks into the button
    // while the home screen is already back underneath.
    const button = document.getElementById('all')
    if (button !== null && canAnimateSheet()) {
      runSheetTransition('close', button, () => flushSync(onClosed))
      return
    }
    const to = prefersReducedMotion() ? null : buttonClip()
    if (to === null) {
      onClosed()
      return
    }
    setCloseTo(to)
    setPhase('closing')
    const timer = window.setTimeout(onClosed, CLOSE_MS)
    return () => window.clearTimeout(timer)
  }, [closing, onClosed])

  const handleScroll = () => {
    const y = scrollerRef.current?.scrollTop ?? 0
    setCompact((current) =>
      !current && y > COMPACT_ON_Y
        ? true
        : current && y < COMPACT_OFF_Y
          ? false
          : current,
    )
  }
  const markTouched = () => {
    touchedRef.current = true
  }

  const isToday = season === today.season && week === today.week
  const list = timetable.data ?? []
  const nextIndex = isToday
    ? list.findIndex((schedule) => schedule.time > clock)
    : -1

  const hours: Array<{ hour: string; groups: Array<HourGroup> }> = []
  list.forEach((schedule: SingleShuttleSchedule, index) => {
    const key = groupOf(schedule.type)
    if (key === null) return
    const [hour, mm] = schedule.time.split(':')
    let entry = hours[hours.length - 1]
    if (entry === undefined || entry.hour !== hour) {
      entry = { hour, groups: [] }
      hours.push(entry)
    }
    let group = entry.groups.find((g) => g.key === key)
    if (group === undefined) {
      group = {
        key,
        tone:
          key === 'circle'
            ? 'cycle'
            : key === 'jungang'
              ? 'jungang'
              : key === 'directY'
                ? 'yesulin'
                : 'direct',
        label:
          key === 'circle'
            ? t('cycle')
            : key === 'jungang'
              ? t('cycle_ja')
              : key === 'directY'
                ? t('yesul')
                : t('direct'),
        minutes: [],
      }
      entry.groups.push(group)
    }
    if (schedule.type === 'R') group.tone = 'orange'
    group.minutes.push({
      mm,
      state: !isToday
        ? 'upcoming'
        : nextIndex < 0 || index < nextIndex
          ? 'past'
          : index === nextIndex
            ? 'next'
            : 'upcoming',
    })
  })
  hours.forEach((entry) =>
    entry.groups.sort(
      (a, b) => GROUP_ORDER.indexOf(a.key) - GROUP_ORDER.indexOf(b.key),
    ),
  )
  const currentHour = clock.slice(0, 2)
  // Scroll target: the hour of the next departure today, or the current hour.
  const targetHour = !isToday
    ? null
    : nextIndex >= 0
      ? list[nextIndex].time.slice(0, 2)
      : hours.some((entry) => entry.hour === currentHour)
        ? currentHour
        : null

  // Once the sheet has opened, glide down to that hour. The glide is driven
  // frame by frame and stops the moment the user scrolls, taps or types, so
  // it never fights them or pulls them back down.
  useEffect(() => {
    if (targetHour === null || scrolledToTargetRef.current) return
    let frame = 0
    const start = window.setTimeout(() => {
      const scroller = scrollerRef.current
      const card = targetCardRef.current
      if (scroller === null || card === null || touchedRef.current) return
      // Marked only once it actually runs: StrictMode's mount/cleanup/mount
      // would otherwise cancel the timer and skip the scroll for good.
      scrolledToTargetRef.current = true
      const from = scroller.scrollTop
      const to = Math.max(0, card.offsetTop - 72)
      const startedAt = performance.now()
      const step = (now: number) => {
        if (touchedRef.current) return
        const progress = Math.min(1, (now - startedAt) / GLIDE_MS)
        const eased = 1 - Math.pow(1 - progress, 3)
        scroller.scrollTop = from + (to - from) * eased
        if (progress < 1) frame = window.requestAnimationFrame(step)
      }
      frame = window.requestAnimationFrame(step)
    }, GLIDE_DELAY_MS)
    return () => {
      window.clearTimeout(start)
      window.cancelAnimationFrame(frame)
    }
  }, [targetHour])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onBack()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

  const locationOptions: Array<[StopLocation, string]> = [
    ['shuttlecoke_o', t('shuttlecoke_o')],
    ['subway', t('dest_subway')],
    ['jungang', t('dest_jungang')],
    ['yesulin', t('dest_yesul')],
    ['residence', t('dest_dorm')],
    ['shuttlecoke_i', t('shuttlecoke_i')],
  ]
  const seasonOptions: Array<[Season, string]> = [
    ['semester', t('semester')],
    ['vacation', t('vacation')],
    ['vacation_session', t('vacation_session')],
  ]
  const weekOptions: Array<[Week, string]> = [
    ['week', t('week')],
    ['weekend', t('weekend')],
  ]
  const filters: Array<{
    title: string
    value: string
    options: Array<[string, string]>
    onPick: (value: string) => void
  }> = [
    {
      title: t('bus_stop'),
      value: location,
      options: locationOptions,
      onPick: (value) => setLocation(value as StopLocation),
    },
    {
      title: t('period'),
      value: season,
      options: seasonOptions,
      onPick: (value) => setSeason(value as Season),
    },
    {
      title: t('days_week'),
      value: week,
      options: weekOptions,
      onPick: (value) => setWeek(value as Week),
    },
  ]
  const summary = [
    t(`${location}_btn`).replace('\n', ' '),
    seasonOptions.find(([key]) => key === season)?.[1],
    weekOptions.find(([key]) => key === week)?.[1],
  ].join(' · ')

  const renderHours = () => {
    if (timetable.isPending) {
      return (
        <HourList aria-hidden="true">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </HourList>
      )
    }

    if (timetable.isError) {
      return (
        <Message>
          {t('api_error')}
          <br />
          <ErrorButton type="button" onClick={openApiMonitor}>
            {t('status_check')}
          </ErrorButton>
        </Message>
      )
    }

    if (hours.length === 0) return <Message>{t('none_data')}</Message>

    // Keyed by the filters so the cards rise in again when they change.
    return (
      <HourList key={listKey}>
        {hours.map((entry, i) => {
          const now = isToday && entry.hour === currentHour
          return (
            <HourCard
              key={entry.hour}
              ref={entry.hour === targetHour ? targetCardRef : undefined}
              data-now={now ? 'true' : 'false'}
              data-enter={cardsEnter ? 'true' : 'false'}
              style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
            >
              <HourLabel>
                <HourText>
                  {entry.hour}
                  {t('o_clock')}
                </HourText>
                {now && (
                  <NowBadge>
                    <NowDot aria-hidden="true" />
                    {t('now_label')}
                  </NowBadge>
                )}
              </HourLabel>
              <Groups>
                {entry.groups.map((group) => (
                  <Group key={group.key}>
                    <GroupChip tone={group.tone}>{group.label}</GroupChip>
                    <Minutes>
                      {group.minutes.map((minute, i) => (
                        <Minute
                          key={`${minute.mm}-${i}`}
                          data-state={minute.state}
                        >
                          {minute.mm}
                        </Minute>
                      ))}
                    </Minutes>
                  </Group>
                ))}
              </Groups>
            </HourCard>
          )
        })}
      </HourList>
    )
  }

  return (
    <ThemeRoot data-theme={theme}>
      <Sheet
        ref={sheetRef}
        data-fulltime-page=""
        onPointerDownCapture={markTouched}
        onWheelCapture={markTouched}
        onTouchStartCapture={markTouched}
        onKeyDownCapture={markTouched}
        data-phase={phase}
        style={{ clipPath }}
      >
        <CompactBar
          aria-hidden={!compact}
          data-visible={compact ? 'true' : 'false'}
        >
          <CompactInner>
            <BackButton
              type="button"
              aria-label={t('back_home')}
              tabIndex={compact ? 0 : -1}
              onClick={onBack}
            >
              <BackIcon aria-hidden="true" />
            </BackButton>
            <CompactTitle>{t('all_btn')}</CompactTitle>
            <SummaryButton
              type="button"
              aria-label={t('scroll_top')}
              tabIndex={compact ? 0 : -1}
              onClick={() =>
                scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
              }
            >
              <SummaryText>{summary}</SummaryText>
              <UpIcon aria-hidden="true" />
            </SummaryButton>
          </CompactInner>
        </CompactBar>
        <Scroller ref={scrollerRef} onScroll={handleScroll}>
          <Column>
            <Header>
              <BackButton
                type="button"
                aria-label={t('back_home')}
                onClick={onBack}
              >
                <BackIcon aria-hidden="true" />
              </BackButton>
              <Title>{t('all_btn')}</Title>
            </Header>
            {filters.map((filter) => (
              <FilterGroup key={filter.title}>
                <FilterTitle>{filter.title}</FilterTitle>
                <FilterChips>
                  {filter.options.map(([value, label]) => {
                    const on = filter.value === value
                    return (
                      <FilterChip
                        key={value}
                        type="button"
                        aria-pressed={on}
                        data-on={on ? 'true' : 'false'}
                        onClick={() => {
                          if (on) return
                          filter.onPick(value)
                          setOpenedListKey(null)
                        }}
                      >
                        <CheckWrap
                          aria-hidden="true"
                          data-on={on ? 'true' : 'false'}
                        >
                          <CheckIcon />
                        </CheckWrap>
                        {label}
                      </FilterChip>
                    )
                  })}
                </FilterChips>
              </FilterGroup>
            ))}
            {renderHours()}
          </Column>
        </Scroller>
      </Sheet>
    </ThemeRoot>
  )
}

export default FullTime
