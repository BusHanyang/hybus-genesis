import { useQuery } from '@tanstack/react-query'
import { classed } from '@tw-classed/react'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import BackImg from '/public/image/arrow_back_outline_24dp.svg?react'
import CheckImg from '/public/image/check_outline_24dp.svg?react'
import ChevronImg from '/public/image/chevron_up_24dp.svg?react'
import { useDarkmodeContext } from '@/context/ThemeContext'
import { Season, SingleShuttleSchedule, StopLocation, Week } from '@/data'
import { seasonKeys } from '@/data/shuttle/season'
import { weekKeys } from '@/data/shuttle/week'
import { shuttleAPI } from '@/network'

import { useDarkMode } from '../useDarkMode'

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
// The sheet grows out of the home button, and shrinks back into it on close.
const FULL_CLIP = 'inset(0px 0px 0px 0px round 0px)'
const CLOSE_MS = 560

const buttonClip = (): string | null => {
  const button = document.getElementById('all')
  if (button === null) return null
  const box = button.getBoundingClientRect()
  return `inset(${box.top}px ${window.innerWidth - box.right}px ${window.innerHeight - box.bottom}px ${box.left}px round 16px)`
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
const Sheet = classed(
  'div',
  'fixed inset-0 z-[1] overflow-hidden bg-ft-page font-Ptd text-theme-text select-none [transition:clip-path_.55s_cubic-bezier(.3,.9,.25,1),background-color_.35s_ease]',
)
const Scroller = classed(
  'div',
  'absolute inset-0 overflow-y-auto overscroll-contain transition-opacity duration-[250ms]',
  {
    variants: {
      // Content fades in a beat after the sheet starts growing.
      'data-shown': {
        true: 'opacity-100 delay-[160ms]',
        false: 'opacity-0',
      },
    },
    defaultVariants: {
      'data-shown': 'false',
    },
  },
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
  'grid grid-cols-[58px_minmax(0,1fr)] items-center gap-2.5 rounded-[20px] px-4 py-3.5 transition-[background-color,box-shadow] duration-300 animate-rise hm:grid-cols-[50px_minmax(0,1fr)] hm:px-3',
  {
    variants: {
      'data-now': {
        true: 'bg-ft-hour-now shadow-[inset_0_0_0_1.5px_var(--color-ft-now)]',
        false: 'bg-ft-element',
      },
    },
    defaultVariants: {
      'data-now': 'false',
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

const FullTime = () => {
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
  const [phase, setPhase] = useState<'opening' | 'open' | 'closing'>('opening')
  // Start clipped to the home button from the very first style the sheet
  // gets, so the grow transition starts there (not from a placeholder).
  const [clip, setClip] = useState<string>(() =>
    prefersReducedMotion() ? FULL_CLIP : (buttonClip() ?? FULL_CLIP),
  )
  const scrollerRef = useRef<HTMLDivElement>(null)
  const touchedRef = useRef<boolean>(false)
  const scrolledToTargetRef = useRef<boolean>(false)
  const targetCardRef = useRef<HTMLDivElement>(null)
  const timetable = useQuery({
    queryKey: ['fullTime', season, week, location],
    queryFn: async () => await shuttleAPI(season, week, location),
    staleTime: 5 * 60 * 1000,
  })
  const { theme } = useDarkmodeContext()
  const { setBackground } = useDarkMode()
  const navigate = useNavigate()
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

  // Open: grow from the home button to full screen on the next frames.
  useLayoutEffect(() => {
    if (clip === FULL_CLIP) {
      setPhase('open')
      return
    }
    let second = 0
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => {
        setClip(FULL_CLIP)
        setPhase('open')
      })
    })
    return () => {
      window.cancelAnimationFrame(first)
      window.cancelAnimationFrame(second)
    }
    // Runs once on mount; later clip changes are the close animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Once the sheet has opened, glide down to that hour (and settle there once
  // more if the cards were still rising), unless the user has already moved.
  useEffect(() => {
    if (targetHour === null || scrolledToTargetRef.current) return
    scrolledToTargetRef.current = true
    const scrollTo = (smooth: boolean) => {
      const scroller = scrollerRef.current
      const card = targetCardRef.current
      if (scroller === null || card === null || touchedRef.current) return
      const top = Math.max(0, card.offsetTop - 72)
      if (smooth) scroller.scrollTo({ top, behavior: 'smooth' })
      else if (Math.abs(scroller.scrollTop - top) > 40) scroller.scrollTop = top
    }
    const glide = window.setTimeout(() => scrollTo(true), 450)
    const settle = window.setTimeout(() => scrollTo(false), 1400)
    return () => {
      window.clearTimeout(glide)
      window.clearTimeout(settle)
    }
  }, [targetHour])

  const goToHomeScreen = () => {
    if (phase === 'closing') return
    const goBack = () => {
      if (window.history.state && window.history.length > 1) {
        navigate(-1)
      } else {
        navigate('/', { replace: true })
      }
    }
    const to = buttonClip()
    if (to === null || prefersReducedMotion()) {
      goBack()
      return
    }
    setPhase('closing')
    setClip(to)
    window.setTimeout(goBack, CLOSE_MS)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') goToHomeScreen()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

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
      <HourList key={`${location}-${season}-${week}`}>
        {hours.map((entry, i) => {
          const now = isToday && entry.hour === currentHour
          return (
            <HourCard
              key={entry.hour}
              ref={entry.hour === targetHour ? targetCardRef : undefined}
              data-now={now ? 'true' : 'false'}
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
      <Sheet data-fulltime-page="" style={{ clipPath: clip }}>
        <CompactBar
          aria-hidden={!compact}
          data-visible={compact ? 'true' : 'false'}
        >
          <CompactInner>
            <BackButton
              type="button"
              aria-label={t('back_home')}
              tabIndex={compact ? 0 : -1}
              onClick={goToHomeScreen}
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
        <Scroller
          ref={scrollerRef}
          data-shown={phase === 'open' ? 'true' : 'false'}
          onScroll={handleScroll}
          onPointerDown={markTouched}
          onWheel={markTouched}
          onTouchStart={markTouched}
        >
          <Column>
            <Header>
              <BackButton
                type="button"
                aria-label={t('back_home')}
                onClick={goToHomeScreen}
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
                          if (!on) filter.onPick(value)
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
