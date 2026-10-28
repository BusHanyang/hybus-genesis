import { useQueryClient } from '@tanstack/react-query'
import { classed } from '@tw-classed/react'
import React, { useEffect, useRef, useState } from 'react'

const DISTANCE = 64
const SLOP = 8
const START = -40
const REST = START + DISTANCE
const RADIUS = 8.75
const STROKE = 2.5
const HALFWAY_ANGLE = 180 + 0.12 * 360

type Phase = 'idle' | 'pulling' | 'refreshing' | 'done'

const Chip = classed(
  'div',
  'pointer-events-none fixed inset-x-0 top-0 z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-solid border-off bg-theme-card text-ptr-color shadow-fab',
  {
    variants: {
      'data-phase': {
        idle: 'opacity-0 transition-[translate,opacity] duration-200 ease-smooth',
        pulling: '',
        refreshing: 'transition-[translate] duration-200 ease-smooth',
        done: 'scale-0 transition-[scale] duration-150 ease-in',
      },
    },
  },
)

const PullRing = classed('svg', 'h-10 w-10 shrink-0')

const Spinner = classed(
  'svg',
  'h-10 w-10 shrink-0 animate-[hb-ptr-turn_1.4s_linear_infinite]',
)

const SpinnerArc = classed(
  'circle',
  'animate-[hb-ptr-arc_1.4s_ease-in-out_infinite]',
)

const pose = (pulled: number) => {
  const progress = Math.min(pulled / DISTANCE, 1)
  return {
    top: START + DISTANCE * progress,
    trim: 0.1 + 0.69 * progress,
    angle: -90 + 270 * progress,
  }
}

const SPIN_TURN = pose(DISTANCE).angle - HALFWAY_ANGLE
const SPIN_DELAY = { animationDelay: '-0.7s' }

const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms))

const PullToRefresh = ({ children }: React.PropsWithChildren) => {
  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<Phase>('idle')
  const [pulled, setPulled] = useState(0)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let start: { x: number; y: number } | null = null
    let pulling = false
    let latched = false
    let distance = 0
    let generation = 0
    let mousing = false

    const cancel = () => {
      start = null
      if (!pulling) return
      pulling = false
      latched = false
      distance = 0
      setPhase('idle')
      setPulled(0)
      setArmed(false)
    }

    const begin = (x: number, y: number) => {
      cancel()
      start = window.scrollY > 0 ? null : { x, y }
    }

    const move = (x: number, y: number, event: Event) => {
      if (!start) return
      if (!pulling) {
        const moved = y - start.y
        if (moved <= -SLOP || window.scrollY > 0) {
          start = null
          return
        }
        if (moved > 0 && event.cancelable) event.preventDefault()
        if (moved < SLOP) return
        if (Math.abs(x - start.x) > moved) {
          start = null
          return
        }
        pulling = true
        generation += 1
        start = { x: start.x, y: start.y + SLOP }
        setPhase('pulling')
      }
      const dy = y - start.y
      if (dy < 0) {
        cancel()
        return
      }
      if (event.cancelable) event.preventDefault()
      distance = dy / 2
      latched = distance >= DISTANCE || (latched && distance >= DISTANCE * 0.75)
      setPulled(Math.min(distance, DISTANCE))
      setArmed(latched)
    }

    const end = () => {
      if (!pulling) {
        start = null
        return
      }
      if (!latched) {
        cancel()
        return
      }
      start = null
      pulling = false
      latched = false
      distance = 0
      const current = generation
      setPhase('refreshing')
      setArmed(false)
      Promise.race([
        Promise.all([queryClient.resetQueries(), wait(500)]),
        wait(8000),
      ]).then(() => {
        if (current === generation) setPhase('done')
      })
    }

    let touched: EventTarget | null = null

    const onTouchStart = (event: Event) => {
      const { touches, target } = event as TouchEvent
      if (target !== touched) track(target)
      if (touches.length !== 1) {
        cancel()
        return
      }
      begin(touches[0].clientX, touches[0].clientY)
    }
    const onTouchMove = (event: Event) => {
      const { touches } = event as TouchEvent
      if (touches.length === 1) {
        move(touches[0].clientX, touches[0].clientY, event)
      }
    }
    const onTouchEnd = () => {
      untrack()
      end()
    }
    const onTouchCancel = () => {
      untrack()
      cancel()
    }
    const whenRemoved = (handler: (event: Event) => void) => (event: Event) => {
      if (!(touched instanceof Node && touched.isConnected)) handler(event)
    }
    const removedStart = whenRemoved(onTouchStart)
    const removedMove = whenRemoved(onTouchMove)
    const removedEnd = whenRemoved(onTouchEnd)
    const removedCancel = whenRemoved(onTouchCancel)
    const untrack = () => {
      touched?.removeEventListener('touchstart', removedStart)
      touched?.removeEventListener('touchmove', removedMove)
      touched?.removeEventListener('touchend', removedEnd)
      touched?.removeEventListener('touchcancel', removedCancel)
      touched = null
    }
    const track = (target: EventTarget | null) => {
      untrack()
      touched = target
      touched?.addEventListener('touchstart', removedStart)
      touched?.addEventListener('touchmove', removedMove, { passive: false })
      touched?.addEventListener('touchend', removedEnd)
      touched?.addEventListener('touchcancel', removedCancel)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') track(event.target)
    }
    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return
      mousing = true
      begin(event.clientX, event.clientY)
    }
    const onMouseUp = () => {
      if (!mousing) return
      mousing = false
      end()
    }
    const onMouseMove = (event: MouseEvent) => {
      if (!mousing) return
      if (event.buttons & 1) move(event.clientX, event.clientY, event)
      else onMouseUp()
    }

    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    element.addEventListener('touchend', onTouchEnd)
    element.addEventListener('touchcancel', onTouchCancel)
    element.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      generation += 1
      untrack()
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
      element.removeEventListener('touchend', onTouchEnd)
      element.removeEventListener('touchcancel', onTouchCancel)
      element.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [queryClient])

  const { top, trim, angle } = pose(pulled)
  const offset = phase === 'idle' ? START : phase === 'pulling' ? top : REST
  const spinning =
    phase === 'refreshing' || phase === 'done' || (phase === 'pulling' && armed)

  return (
    <>
      <div ref={ref}>{children}</div>
      <Chip
        aria-hidden="true"
        data-phase={phase}
        style={{ translate: `0 ${offset}px` }}
      >
        {!spinning ? (
          <PullRing viewBox="-20 -20 40 40">
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
          </PullRing>
        ) : (
          <Spinner viewBox="-20 -20 40 40" style={SPIN_DELAY}>
            <g transform={`rotate(${SPIN_TURN})`}>
              <SpinnerArc
                r={RADIUS}
                pathLength={100}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                strokeLinecap="square"
                strokeDasharray="25 100"
                style={SPIN_DELAY}
              />
            </g>
          </Spinner>
        )}
      </Chip>
    </>
  )
}

export default PullToRefresh
