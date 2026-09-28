import { classed } from '@tw-classed/react'
import { t } from 'i18next'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ArrowImg from '/public/image/arrow_right_10dp.svg?react'
import {
  convertUnixToTime,
  useShuttleTimetable,
} from '@/components/shuttle/useShuttleTimetable'
import { SingleShuttleSchedule, StopLocation } from '@/data'
import { seasonKeys } from '@/data/shuttle/season'
import { weekKeys } from '@/data/shuttle/week'

export type ShuttlePaneStatus = 'loading' | 'rows' | 'ended' | 'empty' | 'error'

// Rows are absolutely positioned at `slot * ROW_HEIGHT`, so a departing bus
// can slide out while the next ones move up instead of the list re-rendering.
const ROW_HEIGHT = 38
const VISIBLE_ROWS = 5
// A bus that has just left shows "출발!" for FLASH seconds, then slides up and
// fades out over EXIT seconds.
const FLASH_SECONDS = 1.5
const EXIT_SECONDS = 1
const FRESH_MS = 700
const SKELETON_WIDTHS = [
  [96, 78],
  [110, 64],
  [88, 84],
  [104, 70],
  [92, 80],
]

// Shared by the rows and their loading skeleton so both line up.
const rowColumns =
  'grid-cols-[50px_minmax(0,136px)_20px_minmax(0,110px)] hm:grid-cols-[46px_minmax(0,128px)_18px_minmax(0,104px)]'

const PaneBody = classed('div', 'px-3.5 pt-3')
const PaneTitle = classed(
  'h2',
  'm-0 flex min-h-9 items-center justify-center px-11 text-[21px] leading-tight font-extrabold tracking-[-0.02em] text-balance hm:px-10 hm:text-[19px] hsm:text-[17px]',
)
const PressArea = classed(
  'div',
  'mt-2.5 block w-full rounded-[14px] py-0.5 transition-[scale,background-color] duration-200',
  {
    variants: {
      'data-pressed': {
        true: 'scale-[.985] bg-press-bg',
        false: 'bg-transparent',
      },
    },
    defaultVariants: {
      'data-pressed': 'false',
    },
  },
)
const RowsWindow = classed(
  'div',
  'relative overflow-hidden transition-[height] duration-[450ms] ease-smooth',
)
// Each row sits at `translateY(slot * ROW_HEIGHT)`; a departed row (slot < 0)
// slides up and fades out.
const RowSlot = classed(
  'div',
  'absolute inset-x-0 top-0 block h-[38px] transition-[transform,opacity] duration-[650ms,500ms] ease-[cubic-bezier(.3,.9,.25,1),ease]',
  {
    variants: {
      'data-departed': {
        true: 'opacity-0',
        false: 'opacity-100',
      },
    },
    defaultVariants: {
      'data-departed': 'false',
    },
  },
)
const RowGrid = classed(
  'div',
  `relative grid h-[38px] ${rowColumns} items-center justify-center text-left hsm:text-sm`,
  {
    variants: {
      'data-fresh': {
        true: 'animate-row-fade',
        false: '',
      },
    },
    defaultVariants: {
      'data-fresh': 'false',
    },
  },
)
const Chip = classed(
  'span',
  'inline-flex h-6 w-11 items-center justify-center rounded-xl text-[13.5px] font-bold tracking-tight text-[#111111] hsm:w-10 hsm:text-[12.5px]',
  {
    variants: {
      'data-tone': {
        cycle: 'bg-chip-red',
        jungang: 'bg-chip-purple',
        yesulin: 'bg-chip-green',
        orange: 'bg-chip-orange',
        direct: 'bg-chip-blue',
      },
    },
  },
)
const TimeCell = classed(
  'span',
  'flex h-[26px] items-center justify-end justify-self-end overflow-hidden whitespace-nowrap text-base hsm:text-sm',
)
// Countdown and actual time flip in (per-row delay) when the press toggles.
const flipVariants = {
  variants: {
    'data-flip': {
      true: 'animate-flip-in',
      false: '',
    },
  },
  defaultVariants: {
    'data-flip': 'false',
  },
} as const
const DepartText = classed(
  'span',
  'inline-block font-extrabold text-actual animate-pop',
)
const ActualTime = classed(
  'span',
  'inline-block font-extrabold tabular-nums text-actual',
  flipVariants,
)
const CountdownBox = classed('span', 'flex items-center', flipVariants)
const ScreenReaderText = classed('span', 'sr-only')
const CountdownText = classed(
  'span',
  'flex items-center transition-colors duration-300',
  {
    variants: {
      // Under a minute left: orange and softly blinking.
      'data-soon': {
        true: 'font-bold text-actual animate-blink-soft',
        false: 'font-medium',
      },
    },
    defaultVariants: {
      'data-soon': 'false',
    },
  },
)
const LeftLabel = classed('span', 'whitespace-pre')
const Digits = classed('span', 'flex items-center')
const DigitWindow = classed(
  'span',
  'inline-block h-[22px] overflow-hidden leading-[22px] tabular-nums',
)
const DigitStrip = classed('span', 'flex flex-col', {
  variants: {
    'data-roll': {
      true: 'animate-roll',
      false: '',
    },
  },
  defaultVariants: {
    'data-roll': 'false',
  },
})
const ArrowIcon = classed(ArrowImg, 'h-[9px] w-[9px] justify-self-center')
const Destination = classed(
  'span',
  'truncate text-base font-medium hsm:text-sm',
)
const DepartFlash = classed(
  'span',
  'absolute inset-x-2 inset-y-[3px] rounded-[10px] bg-depart-bg animate-flash',
)
const SkeletonList = classed('div', 'mt-2.5 flex flex-col items-center py-0.5')
const SkeletonRow = classed('div', `grid h-[38px] ${rowColumns} items-center`)
const SkeletonChip = classed('span', 'hb-skeleton h-6 w-11 rounded-xl')
const SkeletonBar = classed('span', 'hb-skeleton h-3.5', {
  variants: {
    'data-align': {
      end: 'justify-self-end',
      start: '',
    },
  },
  defaultVariants: {
    'data-align': 'start',
  },
})
const StatusBox = classed(
  'div',
  'flex flex-col items-center justify-center text-center',
  {
    variants: {
      'data-kind': {
        message: 'h-[150px]',
        ended: 'h-[172px] animate-rise',
      },
    },
    defaultVariants: {
      'data-kind': 'message',
    },
  },
)
const StatusText = classed('div', 'text-base font-semibold leading-6')
const EndedText = classed(StatusText, 'mt-2 font-bold')
const StatusButton = classed(
  'button',
  'mt-3 rounded-[10px] bg-press-bg px-3 py-2 text-sm font-semibold text-ink-2',
)
const SleepImage = classed(
  'img',
  'h-28 w-[104px] object-contain animate-float drag-save-n',
)

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

export const formatSecondsLeft = (n: number): string => {
  const seconds = n % 60
  const minutes = Math.floor(n / 60) % 60
  const hours = Math.floor(n / 3600)

  return `${hours > 0 ? `${pad(hours)}:` : ''}${pad(minutes)}:${pad(seconds)}`
}

const busTypeToText = (busType: string): string => {
  if (busType == 'C') {
    return t('cycle')
  } else if (busType == 'NA') {
    return t('NA')
  } else {
    return t('direct')
  }
}

const getBusDestination = (busType: string, currentLoc: string): string => {
  if (currentLoc == 'shuttlecoke_o') {
    if (busType == 'C' || busType == 'DH' || busType == 'DHJ') {
      return t('dest_subway')
    } else if (busType == 'DY') {
      return t('dest_yesul')
    } else {
      return t('loading')
    }
  } else if (currentLoc == 'subway') {
    if (busType == 'C') {
      return t('dest_yesul')
    } else if (busType == 'DHJ') {
      return t('dest_jungang')
    } else {
      return t('dest_shuttle_i')
    }
  } else if (currentLoc == 'yesulin') {
    return t('dest_shuttle_i')
  } else if (currentLoc == 'jungang') {
    return t('dest_shuttle_i')
  } else if (currentLoc == 'shuttlecoke_i') {
    if (busType == 'NA') {
      return t('no_dest')
    } else if (busType == 'R') {
      return t('dest_dorm')
    } else {
      return t('loading')
    }
  } else if (currentLoc == 'residence') {
    return t('dest_shuttle_o')
  } else {
    return t('loading')
  }
}

export const titleText = (location: string): string => {
  if (location == 'shuttlecoke_o') {
    return t('shuttlecoke_o')
  } else if (location == 'subway') {
    return t('subway')
  } else if (location == 'jungang') {
    return t('jungang')
  } else if (location == 'yesulin') {
    return t('yesulin')
  } else if (location == 'shuttlecoke_i') {
    return t('shuttlecoke_i')
  } else if (location == 'residence') {
    return t('residence')
  } else {
    return t('else')
  }
}

const chipTone = (chipType: string) => {
  if (chipType == 'C') return 'cycle'
  if (chipType == 'DHJ') return 'jungang'
  if (chipType == 'DY') return 'yesulin'
  if (chipType == 'R' || chipType == 'NA') return 'orange'
  return 'direct'
}

const openApiMonitor = () => {
  window.open(
    'https://monitor.hybus.app/status/bushanyang',
    '_blank',
    'noopener noreferrer',
  )
}

/**
 * Countdown whose digits roll like an odometer. Each digit is keyed by its
 * position from the right plus its value, so only the digits that changed
 * remount and replay the roll. The roll starts from the text this countdown
 * actually showed on the previous tick; a fresh mount (pane switch, releasing
 * a long press) shows the digits without rolling.
 */
const Countdown = (props: { seconds: number }) => {
  const text = formatSecondsLeft(props.seconds)
  const [shown, setShown] = useState({ text, previous: text })
  let previous = shown.previous
  if (shown.text !== text) {
    previous = shown.text
    setShown({ text, previous })
  }
  const chars = text.split('')

  return (
    <Digits aria-hidden="true">
      {chars.map((ch, i) => {
        const fromRight = chars.length - 1 - i
        const prev = previous[previous.length - 1 - fromRight] ?? ch
        const rolls = /\d/.test(ch) && prev !== ch

        return (
          <DigitWindow key={`${fromRight}-${ch}`}>
            <DigitStrip data-roll={rolls ? 'true' : 'false'}>
              <span>{ch}</span>
              <span>{rolls ? prev : ch}</span>
            </DigitStrip>
          </DigitWindow>
        )
      })}
    </Digits>
  )
}

const TimetableRow = (props: {
  schedule: SingleShuttleSchedule
  location: string
  slot: number
  secondsLeft: number
  pressed: boolean
  flipping: boolean
  fresh: boolean
  entryDelay: number
}) => {
  const { t } = useTranslation()
  const { schedule, slot, secondsLeft } = props
  const departing = secondsLeft <= 0
  const shownSeconds = Math.max(0, Math.ceil(secondsLeft))
  const soon = secondsLeft > 0 && secondsLeft < 60
  const [hour, minute] = convertUnixToTime(schedule).time.split(':')
  const flip = props.flipping ? 'true' : 'false'
  const flipDelay = { animationDelay: `${Math.max(0, slot) * 35}ms` }

  return (
    <RowSlot
      data-departed={slot < 0 ? 'true' : 'false'}
      style={{ transform: `translateY(${slot * ROW_HEIGHT}px)` }}
    >
      {departing && <DepartFlash />}
      <RowGrid
        data-fresh={props.fresh ? 'true' : 'false'}
        style={{
          animationDelay: `${props.entryDelay + Math.max(0, Math.min(slot, 5)) * 35}ms`,
        }}
      >
        <Chip data-tone={chipTone(schedule.type)}>
          {busTypeToText(schedule.type)}
        </Chip>
        <TimeCell>
          {departing ? (
            <DepartText>{t('departing')}</DepartText>
          ) : props.pressed ? (
            <ActualTime data-flip={flip} style={flipDelay}>
              {hour + t('hour') + minute + t('minute') + ' ' + t('departure')}
            </ActualTime>
          ) : (
            <CountdownBox data-flip={flip} style={flipDelay}>
              <ScreenReaderText>
                {formatSecondsLeft(shownSeconds) + ' ' + t('left')}
              </ScreenReaderText>
              <CountdownText
                aria-hidden="true"
                data-soon={soon ? 'true' : 'false'}
              >
                <Countdown seconds={shownSeconds} />
                <LeftLabel> {t('left')}</LeftLabel>
              </CountdownText>
            </CountdownBox>
          )}
        </TimeCell>
        <ArrowIcon aria-hidden="true" />
        <Destination>
          {getBusDestination(schedule.type, props.location)}
        </Destination>
      </RowGrid>
    </RowSlot>
  )
}

const Skeleton = () => (
  <SkeletonList>
    {SKELETON_WIDTHS.map(([w1, w2], i) => (
      <SkeletonRow key={i}>
        <SkeletonChip />
        <SkeletonBar data-align="end" style={{ width: w1 }} />
        <span />
        <SkeletonBar style={{ width: w2 }} />
      </SkeletonRow>
    ))}
  </SkeletonList>
)

export const Shuttle = (props: {
  location: StopLocation
  pressed?: boolean
  flipping?: boolean
  entryDelay?: number
  onPressChange?: (pressed: boolean) => void
  onStatusChange?: (status: ShuttlePaneStatus) => void
}) => {
  const { location } = props
  const { t } = useTranslation()
  const { currentTime, season, timetable, week } =
    useShuttleTimetable(location)
  const [fresh, setFresh] = useState<boolean>(true)
  const pressed = props.pressed ?? false

  // Set week and season to localStorage
  useEffect(() => {
    if (season !== null && season !== seasonKeys.HALT) {
      window.localStorage.setItem('season', season)
    }

    if (week !== null && week !== weekKeys.UNKNOWN) {
      window.localStorage.setItem('week', week)
    }

    if (window.localStorage.getItem('season') === seasonKeys.HALT) {
      window.localStorage.setItem('season', seasonKeys.SEMESTER)
    }

    if (window.localStorage.getItem('week') === weekKeys.UNKNOWN) {
      window.localStorage.setItem('week', weekKeys.WEEK)
    }
  }, [season, week])

  const list = timetable.data ?? []
  const nowSec = currentTime / 1000
  let base = list.findIndex(
    (schedule) => Number(schedule.time) + FLASH_SECONDS > nowSec,
  )
  if (base < 0) base = list.length
  const visibleCount = Math.min(VISIBLE_ROWS, list.length - base)

  let status: ShuttlePaneStatus = 'rows'
  if (timetable.status === 'error') status = 'error'
  else if (timetable.isPending || timetable.data === undefined)
    status = 'loading'
  else if (list.length === 0) status = 'empty'
  else if (visibleCount === 0) status = 'ended'

  const { onStatusChange } = props
  useEffect(() => {
    onStatusChange?.(status)
  }, [onStatusChange, status])

  // Rows fade in once when they first appear; after that only the digits move.
  useEffect(() => {
    if (status !== 'rows') return
    const timer = window.setTimeout(() => setFresh(false), FRESH_MS)
    return () => window.clearTimeout(timer)
  }, [status])

  const setPressed = (next: boolean) => {
    if (next === pressed) return
    if (next) {
      try {
        navigator.vibrate?.(12)
      } catch {
        // Vibration is optional.
      }
    }
    props.onPressChange?.(next)
  }

  const renderBody = () => {
    if (status === 'loading') return <Skeleton />

    if (status === 'error') {
      return (
        <StatusBox>
          <StatusText>{t('api_error')}</StatusText>
          <StatusButton type="button" onClick={openApiMonitor}>
            {t('status_check')}
          </StatusButton>
        </StatusBox>
      )
    }

    if (status === 'empty') {
      return (
        <StatusBox>
          <StatusText>{t('no_today')}</StatusText>
        </StatusBox>
      )
    }

    if (status === 'ended') {
      return (
        <StatusBox data-kind="ended">
          <SleepImage
            src="/image/hanyang_sleep.png"
            alt={t('sleeping_mascot')}
            draggable="false"
          />
          <EndedText>{t('end_today')}</EndedText>
        </StatusBox>
      )
    }

    const rows: React.ReactNode[] = []
    const lastIndex = Math.min(list.length - 1, base + VISIBLE_ROWS)
    for (let i = 0; i <= lastIndex; i++) {
      const schedule = list[i]
      const slot = i - base
      const departedFor = nowSec - Number(schedule.time)
      if (slot < 0 && departedFor >= FLASH_SECONDS + EXIT_SECONDS) continue

      rows.push(
        <TimetableRow
          key={i}
          schedule={schedule}
          location={location}
          slot={slot}
          secondsLeft={Number(schedule.time) - nowSec}
          pressed={pressed}
          flipping={props.flipping ?? false}
          fresh={fresh}
          entryDelay={props.entryDelay ?? 0}
        />,
      )
    }

    return (
      <PressArea
        role="button"
        tabIndex={0}
        aria-pressed={pressed}
        aria-label={t('press_hint_label')}
        data-pressed={pressed ? 'true' : 'false'}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            setPressed(true)
          }
        }}
        onKeyUp={() => setPressed(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <RowsWindow style={{ height: visibleCount * ROW_HEIGHT }}>
          {rows}
        </RowsWindow>
      </PressArea>
    )
  }

  return (
    <PaneBody>
      <PaneTitle>{titleText(location)}</PaneTitle>
      {renderBody()}
    </PaneBody>
  )
}
