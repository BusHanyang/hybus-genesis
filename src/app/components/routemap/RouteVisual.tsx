import { classed } from '@tw-classed/react'
import React from 'react'
import { useTranslation } from 'react-i18next'

import DotAnimation, { DotColor } from '@/components/routemap/DotAnimation'
import { RouteAnimationFlag } from '@/data'

type RouteStatus = keyof RouteAnimationFlag
type RouteTone = DotColor | 'inactive'
type SpecialStopTone = 'cycle' | 'yesulin' | 'jungang' | 'inactive'

const routeToneTable: Record<RouteStatus, DotColor> = {
  direct: 'direct',
  cycle: 'cycle',
  yesulin: 'yesulin',
  jungang: 'jungang',
}

export const stopLeft = {
  '0': 'left-[10%]',
  '1': 'left-[30%]',
  '2': 'left-[50%]',
  '3': 'left-[60%]',
  '4': 'left-[70%]',
  '5': 'left-[90%]',
}
type StopKey = keyof typeof stopLeft
export const stopKey = (index: number) => String(index) as StopKey

const toneBackground = {
  direct: 'bg-chip-blue',
  cycle: 'bg-chip-red',
  yesulin: 'bg-chip-green',
  jungang: 'bg-chip-purple',
  orange: 'bg-chip-orange',
  inactive: 'bg-off',
}

const RouteTrack = classed('div', 'relative h-10 grow')

const RouteLine = classed(
  'span',
  'absolute top-[23px] h-[3px] origin-left rounded-sm transition-[background-color] duration-[350ms] animate-draw',
  {
    variants: {
      tone: toneBackground,
      'data-from': stopLeft,
      'data-width': {
        half: 'w-[10%]',
        full: 'w-[20%]',
      },
    },
    defaultVariants: {
      'data-width': 'full',
    },
  },
)

const RouteStop = classed(
  'span',
  'absolute top-[19px] -ml-[5.5px] h-[11px] w-[11px]',
  {
    variants: {
      'data-stop': stopLeft,
    },
  },
)

const Dot = classed(
  'span',
  'absolute inset-0 rounded-full transition-[background-color] duration-[350ms] animate-dot-pop',
  {
    variants: {
      tone: toneBackground,
      'data-state': {
        hidden: 'opacity-0',
        visible: '',
      },
    },
    defaultVariants: {
      'data-state': 'visible',
    },
  },
)

const PingLayer = classed('span', 'absolute inset-0 animate-ping-in')

const SpecialStopsText = classed(
  'span',
  'absolute bottom-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[11.5px] font-extrabold transition-colors duration-[350ms]',
  {
    variants: {
      lang: {
        ko: 'tracking-tight',
        other: 'tracking-tighter text-[0.7rem]',
      },
      tone: {
        cycle: 'text-t-cycle',
        yesulin: 'text-t-yesulin',
        jungang: 'text-t-jungang',
        inactive: 'text-off-text',
      },
    },
  },
)

// The numbers in lineIndex and dotIndex represent the index numbers for each route.
// The 'direct' route does not have an index 3 because,
// while the other routes include an extra stop(station) at that position (such as yesulin or jungang),
// the 'direct' route does not have an additional stop(station) there.
const lineIndex: Record<RouteStatus, Array<number>> = {
  direct: [0, 1, 2, 4],
  cycle: [0, 1, 2, 3, 4],
  yesulin: [0, 1, 2, 3, 4],
  jungang: [0, 1, 2, 3, 4],
}

const dotIndex: Record<RouteStatus, Array<number>> = {
  direct: [0, 1, 2, 4, 5],
  cycle: [0, 1, 2, 3, 4, 5],
  yesulin: [0, 1, 2, 3, 4, 5],
  jungang: [0, 1, 2, 3, 4, 5],
}

const isPrevStop = (line: RouteStatus, index: number, tab: string) => {
  switch (tab) {
    case 'shuttlecoke_o':
      return index !== 0
    case 'shuttlecoke_i':
      return index >= 4
    case 'subway':
      if (line === 'yesulin') return false
      return index >= 2
    case 'yesulin':
      if (line === 'direct' || line === 'jungang') return false
      return index >= 3
    case 'jungang':
      if (line === 'jungang') return index >= 3
      return false
    default:
      return true
  }
}

const getLineTone = (
  routeStatus: RouteStatus,
  index: number,
  tab: string,
): RouteTone => {
  if (!isPrevStop(routeStatus, index, tab)) return 'inactive'
  return index === 4 ? 'orange' : routeToneTable[routeStatus]
}

const getDotTone = (
  routeStatus: RouteStatus,
  item: number,
  tab: string,
): RouteTone => {
  if (!isPrevStop(routeStatus, item, tab)) return 'inactive'
  return item >= 5 ? 'orange' : routeToneTable[routeStatus]
}

const getSpecialStopTone = (
  routeStatus: RouteStatus,
  item: number,
  tab: string,
): SpecialStopTone => {
  if (!isPrevStop(routeStatus, item, tab)) return 'inactive'
  return routeStatus === 'direct' ? 'inactive' : routeStatus
}

const RouteVisual = (props: {
  routeStatus: keyof RouteAnimationFlag
  tab: string
  animationFlagTable: RouteAnimationFlag
  rowIndex: number
}) => {
  const { t, i18n } = useTranslation()
  const { routeStatus, tab, rowIndex } = props
  const stops = dotIndex[routeStatus]

  return (
    <RouteTrack>
      {lineIndex[routeStatus].map((index, i) => (
        <RouteLine
          key={index}
          tone={getLineTone(routeStatus, index, tab)}
          data-from={stopKey(index)}
          data-width={
            routeStatus !== 'direct' && (index === 2 || index === 3)
              ? 'half'
              : 'full'
          }
          style={{
            transitionDelay: `${rowIndex * 30 + i * 55}ms`,
            animationDelay: `${180 + rowIndex * 60 + i * 55}ms`,
          }}
        />
      ))}
      {stops.map((item, j) => (
        <RouteStop key={item} data-stop={stopKey(item)}>
          <PingLayer>
            <DotAnimation
              isOn={props.animationFlagTable[routeStatus][item]}
              index={item}
              color={item >= 5 ? 'orange' : routeToneTable[routeStatus]}
              routeStatus={routeStatus}
            />
          </PingLayer>
          <Dot
            tone={getDotTone(routeStatus, item, tab)}
            data-state={
              item === 2 && routeStatus === 'yesulin' ? 'hidden' : 'visible'
            }
            style={{
              transitionDelay: `${rowIndex * 30 + j * 55}ms`,
              animationDelay: `${120 + rowIndex * 60 + j * 55}ms`,
            }}
          />
          {item === 3 && (
            <SpecialStopsText
              lang={i18n.language === 'ko' ? 'ko' : 'other'}
              tone={getSpecialStopTone(routeStatus, item, tab)}
              style={{ transitionDelay: `${rowIndex * 30 + j * 55}ms` }}
            >
              {routeStatus === 'jungang' ? t('jung') : t('yesul')}
            </SpecialStopsText>
          )}
        </RouteStop>
      ))}
    </RouteTrack>
  )
}

export default React.memo(RouteVisual)
