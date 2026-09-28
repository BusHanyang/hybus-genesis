import { classed } from '@tw-classed/react'
import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

import CloseImg from '/public/image/close_outline_24dp.svg?react'
import MapImg from '/public/image/map_outline_24dp.svg?react'
import { openNaverMapApp } from '@/components/shuttle/map'
import { Shuttle, ShuttlePaneStatus } from '@/components/shuttle/Shuttle'
import { StopLocation } from '@/data'

const Subway = lazy(() => import('@/components/subway/Subway'))

export const STOP_ORDER = [
  'shuttlecoke_o',
  'subway',
  'yesulin',
  'jungang',
  'shuttlecoke_i',
  'residence',
] as const satisfies ReadonlyArray<StopLocation>

export type StopTab = (typeof STOP_ORDER)[number]

export const isStopTab = (value: string | null): value is StopTab =>
  (STOP_ORDER as ReadonlyArray<string | null>).includes(value)

export const isStation = (tab: string) => tab === 'subway' || tab === 'jungang'

type PaneKey = { tab: StopTab; subway: boolean }
type PaneState = {
  gen: number
  current: PaneKey
  prev: PaneKey | null
  dir: 1 | -1
}

// The outgoing pane leaves in .15s and the incoming one starts at .13s, so the
// previous pane only needs to stay mounted briefly.
const PREV_PANE_MS = 320

type PaneMotion = 'initial' | 'in-right' | 'in-left' | 'out-left' | 'out-right'

const Card = classed(
  'section',
  'relative mt-3 overflow-hidden rounded-[20px] bg-theme-card pb-4 shadow-theme-shadow transition-[background-color,color,box-shadow] duration-[350ms]',
)
const MapButton = classed(
  'button',
  'absolute right-2.5 top-3.5 z-2 flex h-11 w-11 items-center justify-center transition-transform duration-150 active:scale-[.96]',
)
const MapIcon = classed(MapImg, 'h-[26px] w-[26px]')
const PaneViewport = classed('div', 'relative', {
  variants: {
    // Off for the very first measurement so the card doesn't grow from 0.
    'data-animate': {
      true: 'transition-[height] duration-[450ms] ease-smooth',
      false: '',
    },
  },
  defaultVariants: {
    'data-animate': 'false',
  },
})
const Pane = classed('div', 'absolute inset-x-0 top-0', {
  variants: {
    'data-motion': {
      initial: 'animate-pane-in',
      'in-right': 'animate-in-right',
      'in-left': 'animate-in-left',
      'out-left': 'pointer-events-none animate-out-left',
      'out-right': 'pointer-events-none animate-out-right',
    },
  },
  defaultVariants: {
    'data-motion': 'initial',
  },
})

// Collapsible rows under the panes: height and opacity ease together, and
// visibility flips only after closing so hidden buttons can't take focus.
const collapseOpen =
  'visible opacity-100 [transition:height_.4s_cubic-bezier(.3,.9,.25,1),opacity_.3s_ease]'
const collapseClosed =
  'invisible h-0 opacity-0 [transition:height_.4s_cubic-bezier(.3,.9,.25,1),opacity_.3s_ease,visibility_0s_linear_.4s]'
const HintCollapse = classed('div', 'overflow-hidden', {
  variants: {
    'data-open': {
      true: `h-[46px] ${collapseOpen}`,
      false: collapseClosed,
    },
  },
  defaultVariants: {
    'data-open': 'false',
  },
})
const ModeCollapse = classed('div', 'overflow-hidden', {
  variants: {
    'data-open': {
      true: `h-[52px] ${collapseOpen}`,
      false: collapseClosed,
    },
  },
  defaultVariants: {
    'data-open': 'false',
  },
})
const HintWrap = classed('div', 'px-3.5')
const HintBar = classed(
  'div',
  'mt-2.5 flex h-9 items-center rounded-[10px] bg-ontouch-bg pl-3 pr-1 text-sm font-medium transition-colors duration-[350ms] hsm:text-[13px]',
)
const HintText = classed('span', 'grow animate-hint-in')
const HintClose = classed(
  'button',
  'flex h-8 w-8 shrink-0 items-center justify-center transition-transform duration-150 active:scale-[.96]',
)
const CloseIcon = classed(CloseImg, 'h-[15px] w-[15px]')
const ModeRow = classed('div', 'flex justify-center pt-3')
const ModeControl = classed(
  'div',
  'relative grid w-64 grid-cols-2 rounded-[22px] bg-control-main p-1 transition-colors duration-[350ms] hsm:w-56',
)
const ModePill = classed(
  'div',
  'absolute left-1 top-1 h-8 w-[calc(50%-4px)] rounded-2xl bg-control-active transition-transform duration-[450ms] ease-spring',
  {
    variants: {
      'data-mode': {
        bus: 'translate-x-0',
        subway: 'translate-x-full',
      },
    },
    defaultVariants: {
      'data-mode': 'bus',
    },
  },
)
const ModeButton = classed(
  'button',
  'relative h-8 text-sm transition-colors duration-300 hsm:text-xs',
  {
    variants: {
      'data-on': {
        true: 'font-extrabold text-control-on-ink',
        false: 'font-semibold text-theme-text',
      },
    },
    defaultVariants: {
      'data-on': 'false',
    },
  },
)
const SubwayFallback = classed('div', 'h-[239px]')

const paneKeyOf = (tab: StopTab, realtimeMode: boolean): PaneKey => ({
  tab,
  subway: isStation(tab) && realtimeMode,
})

const TimetableCard = (props: {
  tab: StopTab
  realtimeMode: boolean
  onRealtimeModeChange: (mode: 'bus' | 'sub') => void
}) => {
  const { t } = useTranslation()
  const nextKey = paneKeyOf(props.tab, props.realtimeMode)
  const [panes, setPanes] = useState<PaneState>({
    gen: 0,
    current: nextKey,
    prev: null,
    dir: 1,
  })
  const [status, setStatus] = useState<ShuttlePaneStatus>('loading')
  const [pressed, setPressed] = useState<boolean>(false)
  const [flipping, setFlipping] = useState<boolean>(false)
  const [learned, setLearned] = useState<boolean>(false)
  const [hintClosed, setHintClosed] = useState<boolean>(
    () => window.localStorage.getItem('touch_info') === 'closed',
  )
  const [height, setHeight] = useState<number | null>(null)
  const [heightReady, setHeightReady] = useState<boolean>(false)
  const currentPaneRef = useRef<HTMLDivElement>(null)

  // Adjust the pane state while rendering when the stop or mode changes, so the
  // outgoing pane and the incoming one are committed in the same frame.
  if (
    panes.current.tab !== nextKey.tab ||
    panes.current.subway !== nextKey.subway
  ) {
    const oldIndex = STOP_ORDER.indexOf(panes.current.tab)
    const newIndex = STOP_ORDER.indexOf(nextKey.tab)
    const dir =
      oldIndex === newIndex
        ? nextKey.subway
          ? 1
          : -1
        : newIndex > oldIndex
          ? 1
          : -1
    setPanes({
      gen: panes.gen + 1,
      current: nextKey,
      prev: panes.current,
      dir,
    })
    setPressed(false)
  }

  useEffect(() => {
    if (panes.prev === null) return
    const timer = window.setTimeout(() => {
      setPanes((state) =>
        state.gen === panes.gen ? { ...state, prev: null } : state,
      )
    }, PREV_PANE_MS)
    return () => window.clearTimeout(timer)
  }, [panes.gen, panes.prev])

  // The card follows the current pane's height; panes are absolutely positioned
  // so the old and new ones can overlap while they swap.
  useLayoutEffect(() => {
    const element = currentPaneRef.current
    if (element === null) return
    const update = () => setHeight(element.offsetHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [panes.gen])

  useEffect(() => {
    if (height === null || heightReady) return
    const frame = window.requestAnimationFrame(() => setHeightReady(true))
    return () => window.cancelAnimationFrame(frame)
  }, [height, heightReady])

  useEffect(() => {
    if (!flipping) return
    const timer = window.setTimeout(() => setFlipping(false), 700)
    return () => window.clearTimeout(timer)
  }, [flipping, pressed])

  const handlePressChange = useCallback((next: boolean) => {
    setPressed(next)
    setFlipping(true)
    if (next) setLearned(true)
  }, [])

  const closeHint = () => {
    window.localStorage.setItem('touch_info', 'closed')
    setHintClosed(true)
  }

  const renderPane = (key: PaneKey, isCurrent: boolean) => {
    if (key.subway) {
      return (
        <Suspense fallback={<SubwayFallback />}>
          <Subway station={key.tab === 'subway' ? '한대앞' : '중앙'} />
        </Suspense>
      )
    }

    return (
      <Shuttle
        location={key.tab}
        pressed={isCurrent && pressed}
        flipping={isCurrent && flipping}
        entryDelay={panes.gen === 0 ? 0 : 150}
        onPressChange={isCurrent ? handlePressChange : undefined}
        onStatusChange={isCurrent ? setStatus : undefined}
      />
    )
  }

  const currentMotion: PaneMotion =
    panes.gen === 0 ? 'initial' : panes.dir > 0 ? 'in-right' : 'in-left'
  const showHint =
    !hintClosed && !panes.current.subway && status === 'rows'
  const stationTab = isStation(props.tab)

  return (
    <Card>
      <MapButton
        type="button"
        aria-label={t('map_label')}
        onClick={() => openNaverMapApp(props.tab)}
      >
        <MapIcon aria-hidden="true" />
      </MapButton>
      <PaneViewport
        data-animate={heightReady ? 'true' : 'false'}
        style={{ height: height ?? undefined }}
      >
        {panes.prev !== null && (
          <Pane
            key={panes.gen - 1}
            aria-hidden="true"
            data-motion={panes.dir > 0 ? 'out-left' : 'out-right'}
          >
            {renderPane(panes.prev, false)}
          </Pane>
        )}
        <Pane key={panes.gen} ref={currentPaneRef} data-motion={currentMotion}>
          {renderPane(panes.current, true)}
        </Pane>
      </PaneViewport>

      <HintCollapse
        aria-hidden={!showHint}
        data-open={showHint ? 'true' : 'false'}
      >
        <HintWrap>
          <HintBar>
            <HintText key={learned ? 'learned' : 'intro'}>
              {learned ? t('now_actual_time') : t('check_on_touch')}
            </HintText>
            <HintClose
              type="button"
              aria-label={t('close_hint')}
              tabIndex={showHint ? 0 : -1}
              onClick={closeHint}
            >
              <CloseIcon aria-hidden="true" />
            </HintClose>
          </HintBar>
        </HintWrap>
      </HintCollapse>

      <ModeCollapse
        aria-hidden={!stationTab}
        data-open={stationTab ? 'true' : 'false'}
      >
        <ModeRow>
          <ModeControl>
            <ModePill
              aria-hidden="true"
              data-mode={props.realtimeMode ? 'subway' : 'bus'}
            />
            <ModeButton
              type="button"
              aria-pressed={!props.realtimeMode}
              tabIndex={stationTab ? 0 : -1}
              data-on={props.realtimeMode ? 'false' : 'true'}
              onClick={() => props.onRealtimeModeChange('bus')}
            >
              {t('shuttle')}
            </ModeButton>
            <ModeButton
              type="button"
              aria-pressed={props.realtimeMode}
              tabIndex={stationTab ? 0 : -1}
              data-on={props.realtimeMode ? 'true' : 'false'}
              onClick={() => props.onRealtimeModeChange('sub')}
            >
              {t('subw')}
            </ModeButton>
          </ModeControl>
        </ModeRow>
      </ModeCollapse>
    </Card>
  )
}

export default TimetableCard
