import { classed } from '@tw-classed/react'
import React, { useEffect, useRef, useState } from 'react'

import ArrowImg from '/public/image/arrow_back_outline_24dp.svg?react'

const THRESHOLD = 80
const HIDDEN = -60

type Phase = 'idle' | 'pulling' | 'refreshing'

const Chip = classed(
  'div',
  'pointer-events-none fixed inset-x-0 top-0 z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-solid border-off bg-theme-card shadow-fab',
  {
    variants: {
      'data-phase': {
        idle: 'opacity-0 transition-[translate,opacity] duration-300 ease-smooth',
        pulling: '',
        refreshing: 'transition-[translate] duration-300 ease-spring',
      },
    },
  },
)

const Arrow = classed(
  ArrowImg,
  'h-5 w-5 stroke-[2.6] transition-colors duration-200',
  {
    variants: {
      'data-ready': {
        true: 'text-ptr-color',
        false: 'text-ink-3',
      },
    },
  },
)

const SpinnerPop = classed('span', 'flex animate-pop-sm')

const Spinner = classed(
  'span',
  'h-5 w-5 animate-spin rounded-full border-[2.5px] border-control-main border-t-ptr-color',
)

const travelFor = (dy: number) => {
  const pulled = Math.max(dy, 0) / 2
  if (pulled <= THRESHOLD) return pulled
  const over = pulled - THRESHOLD
  return THRESHOLD + over / (1 + over / 48)
}

const PullToRefresh = ({ children }: React.PropsWithChildren) => {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [travel, setTravel] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let start: { x: number; y: number } | null = null
    let pulling = false
    let distance = 0
    let refreshing = false

    const reset = () => {
      if (refreshing) return
      start = null
      pulling = false
      distance = 0
      setPhase('idle')
      setTravel(0)
    }

    const begin = (x: number, y: number) => {
      start = refreshing || window.scrollY > 0 ? null : { x, y }
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
        reset()
        return
      }
      if (event.cancelable) event.preventDefault()
      distance = travelFor(dy)
      setTravel(distance)
    }

    const end = () => {
      if (!pulling) {
        start = null
        return
      }
      if (distance < THRESHOLD) {
        reset()
        return
      }
      start = null
      pulling = false
      refreshing = true
      setPhase('refreshing')
      window.location.reload()
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        begin(event.touches[0].clientX, event.touches[0].clientY)
      } else {
        reset()
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
      else if (start) reset()
    }

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    element.addEventListener('touchend', end)
    element.addEventListener('touchcancel', reset)
    element.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', end)

    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
      element.removeEventListener('touchend', end)
      element.removeEventListener('touchcancel', reset)
      element.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', end)
    }
  }, [])

  const progress = Math.min(travel / THRESHOLD, 1)
  const offset = phase === 'refreshing' ? THRESHOLD : travel

  return (
    <>
      <div ref={ref}>{children}</div>
      <Chip
        aria-hidden="true"
        data-phase={phase}
        style={{ translate: `0 ${HIDDEN + offset}px` }}
      >
        {phase === 'refreshing' ? (
          <SpinnerPop>
            <Spinner />
          </SpinnerPop>
        ) : (
          <Arrow
            data-ready={travel >= THRESHOLD}
            style={{ rotate: `${progress * 180 - 90}deg` }}
          />
        )}
      </Chip>
    </>
  )
}

export default PullToRefresh
