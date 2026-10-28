import { useIsFetching } from '@tanstack/react-query'
import { classed } from '@tw-classed/react'
import React, { useEffect, useRef, useState } from 'react'

const DISTANCE = 64
const START = -40
const REST = START + DISTANCE
const RADIUS = 8.75
const STROKE = 2.5
const HALFWAY_ANGLE = 180 + 0.12 * 360
const RESUME_KEY = 'ptrRefreshAt'

type Phase = 'idle' | 'pulling' | 'refreshing' | 'loading' | 'done'

const Chip = classed(
  'div',
  'pointer-events-none fixed inset-x-0 top-0 z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-solid border-off bg-theme-card text-ptr-color shadow-fab',
  {
    variants: {
      'data-phase': {
        idle: 'opacity-0 transition-[translate,opacity] duration-200 ease-smooth',
        pulling: '',
        refreshing: 'transition-[translate] duration-200 ease-smooth',
        loading: '',
        done: 'scale-0 transition-[scale] duration-150 ease-in',
      },
    },
  },
)

const PullRing = classed(
  'svg',
  'h-10 w-10 shrink-0 transition-opacity duration-300',
  {
    variants: {
      'data-armed': {
        true: 'opacity-100',
        false: 'opacity-30',
      },
    },
  },
)

const Spinner = classed(
  'svg',
  'h-10 w-10 shrink-0 animate-[hb-ptr-turn_1.4s_linear_infinite]',
)

const SpinnerArc = classed(
  'circle',
  'animate-[hb-ptr-arc_1.4s_ease-in-out_infinite]',
)

const pose = (pulled: number) => {
  const drag = Math.min(pulled / DISTANCE, 1)
  const adjusted = (Math.max(drag - 0.4, 0) * 5) / 3
  const slingshot =
    Math.max(0, Math.min(pulled - DISTANCE, DISTANCE * 2)) / DISTANCE
  const tension = (slingshot / 4 - (slingshot / 4) ** 2) * 2
  return {
    top: START + DISTANCE * drag + DISTANCE * tension * 2,
    trim: Math.min(adjusted * 0.8, 0.8),
    arrow: Math.min(adjusted, 1),
    angle: (-0.25 + 0.4 * adjusted + tension * 2) * 0.5 * 360,
  }
}

const PullToRefresh = ({ children }: React.PropsWithChildren) => {
  const ref = useRef<HTMLDivElement>(null)
  const busy = useRef(false)
  const [phase, setPhase] = useState<Phase>(() =>
    Date.now() - Number(window.sessionStorage.getItem(RESUME_KEY)) < 10000
      ? 'loading'
      : 'idle',
  )
  const [pulled, setPulled] = useState(0)
  const [turn, setTurn] = useState(0)
  const fetching = useIsFetching() > 0

  useEffect(() => {
    window.sessionStorage.removeItem(RESUME_KEY)
  }, [])

  useEffect(() => {
    busy.current = phase === 'refreshing' || phase === 'loading'
  }, [phase])

  useEffect(() => {
    if (phase !== 'loading') return
    const timer = window.setTimeout(
      () => setPhase('done'),
      fetching ? 8000 : 500,
    )
    return () => window.clearTimeout(timer)
  }, [phase, fetching])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let start: { x: number; y: number } | null = null
    let pulling = false
    let distance = 0

    const cancel = () => {
      start = null
      if (!pulling) return
      pulling = false
      distance = 0
      setPhase('idle')
      setPulled(0)
    }

    const begin = (x: number, y: number) => {
      start = busy.current || window.scrollY > 0 ? null : { x, y }
    }

    const move = (x: number, y: number, event: Event) => {
      if (!start) return
      const dy = y - start.y
      if (!pulling) {
        const dx = Math.abs(x - start.x)
        if (dx === 0 && dy === 0) return
        if (dy <= dx) {
          start = null
          return
        }
        pulling = true
        setPhase('pulling')
      }
      if (dy < 0) {
        cancel()
        return
      }
      if (event.cancelable) event.preventDefault()
      distance = dy / 2
      setPulled(distance)
    }

    const end = () => {
      if (!pulling) {
        start = null
        return
      }
      if (distance < DISTANCE) {
        cancel()
        return
      }
      start = null
      pulling = false
      busy.current = true
      setTurn(pose(distance).angle - HALFWAY_ANGLE)
      setPhase('refreshing')
      window.sessionStorage.setItem(RESUME_KEY, String(Date.now()))
      window.location.reload()
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        begin(event.touches[0].clientX, event.touches[0].clientY)
      } else {
        cancel()
      }
    }
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        move(event.touches[0].clientX, event.touches[0].clientY, event)
      }
    }
    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 0) begin(event.clientX, event.clientY)
    }
    const onMouseMove = (event: MouseEvent) => {
      if (event.buttons === 1) move(event.clientX, event.clientY, event)
      else if (start) cancel()
    }

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    element.addEventListener('touchend', end)
    element.addEventListener('touchcancel', cancel)
    element.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', end)

    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
      element.removeEventListener('touchend', end)
      element.removeEventListener('touchcancel', cancel)
      element.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', end)
    }
  }, [])

  const { top, trim, arrow, angle } = pose(pulled)
  const offset = phase === 'idle' ? START : phase === 'pulling' ? top : REST
  const delay = phase === 'refreshing' ? { animationDelay: '-0.7s' } : {}
  const width = 10 * arrow
  const height = 5 * arrow

  return (
    <>
      <div ref={ref}>{children}</div>
      <Chip
        aria-hidden="true"
        data-phase={phase}
        style={{ translate: `0 ${offset}px` }}
      >
        {phase === 'idle' || phase === 'pulling' ? (
          <PullRing viewBox="-20 -20 40 40" data-armed={pulled >= DISTANCE}>
            {trim > 0 && (
              <circle
                r={RADIUS}
                pathLength={100}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                strokeLinecap="square"
                strokeDasharray={`${trim * 100} 100`}
                transform={`rotate(${angle})`}
              />
            )}
            {arrow > 0 && (
              <path
                d={`M${RADIUS - width / 2} ${STROKE / 2}L${RADIUS + width / 2} ${STROKE / 2}L${RADIUS} ${STROKE / 2 + height}Z`}
                fill="currentColor"
                transform={`rotate(${angle + trim * 360})`}
              />
            )}
          </PullRing>
        ) : (
          <Spinner viewBox="-20 -20 40 40" style={delay}>
            <g transform={`rotate(${turn})`}>
              <SpinnerArc
                r={RADIUS}
                pathLength={100}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                strokeLinecap="square"
                strokeDasharray="25 100"
                style={delay}
              />
            </g>
          </Spinner>
        )}
      </Chip>
    </>
  )
}

export default PullToRefresh
