import { classed } from '@tw-classed/react'
import React from 'react'
import { useTranslation } from 'react-i18next'

import DotAnimation, {
  DotColor,
  useDotAnimation,
} from '@/components/routemap/DotAnimation'
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

const RouteLine = classed(
  'div',
  'absolute transition duration-150 ease-in-out z-0 h-[0.2rem] top-1 rt1:top-[0.2rem] rt1:h-[0.16rem] left-[0.6rem] max-w-52.5',
  {
    variants: {
      'data-width': {
        half: 'w-[7.8vw]',
        full: 'w-[15.6vw]',
      },
      tone: {
        direct: 'bg-chip-blue',
        cycle: 'bg-chip-red',
        yesulin: 'bg-chip-green',
        jungang: 'bg-chip-purple',
        orange: 'bg-chip-orange',
        inactive: 'bg-zinc-200 dark:bg-slate-500',
      },
    },
    defaultVariants: {
      'data-width': 'full',
    },
  },
)

const Dot = classed(
  'span',
  'flex rounded-full inline-block h-3 w-3 rt1:h-2.5 rt1:w-2.5 z-1 mx-2',
  {
    variants: {
      tone: {
        direct: 'bg-chip-blue',
        cycle: 'bg-chip-red',
        yesulin: 'bg-chip-green',
        jungang: 'bg-chip-purple',
        orange: 'bg-chip-orange',
        inactive: 'bg-zinc-200 dark:bg-slate-500',
      },
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

const RouteStations = classed(
  'div',
  'transition duration-150 ease-in-out flex relative',
)

const SpecialStopsText = classed(
  'p',
  'absolute text-xs top-[-17px] left-[-6.5px] text-center w-10 font-bold',
  {
    variants: {
      lang: {
        ko: 'tracking-tight',
        other: 'tracking-tighter text-[0.7rem]',
      },
      tone: {
        cycle: 'text-chip-red',
        yesulin: 'text-chip-green',
        jungang: 'text-chip-purple',
        inactive: 'text-zinc-200 dark:text-slate-500',
      },
    },
  },
)

const BranchRouteElementGroup = classed(
  'div',
  'col-span-2 grid grid-cols-3 w-[75%] place-items-center',
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

const RouteLines = (props: {
  routeStatus: RouteStatus
  index: number
  tab: string
}) => {
  if (props.index === -1) return
  const index = lineIndex[props.routeStatus][props.index]
  return (
    <RouteLine
      data-width={
        props.routeStatus !== 'direct' && (index === 2 || index === 3)
          ? 'half'
          : 'full'
      }
      tone={getLineTone(props.routeStatus, index, props.tab)}
    />
  )
}

const RouteElement = (props: {
  routeStatus: RouteStatus
  tab: string
  animationFlagTable: { [key: string]: Array<boolean> }
  item: number
}) => {
  const { t, i18n } = useTranslation()

  return (
    <RouteStations>
      <Dot
        tone={getDotTone(props.routeStatus, props.item, props.tab)}
        data-state={
          props.item === 2 && props.routeStatus === 'yesulin'
            ? 'hidden'
            : 'visible'
        }
      >
        {props.item === 3 ? (
          <SpecialStopsText
            key={0}
            lang={i18n.language === 'ko' ? 'ko' : 'other'}
            tone={getSpecialStopTone(props.routeStatus, props.item, props.tab)}
          >
            {props.routeStatus === 'jungang' ? t('jung') : t('yesul')}
          </SpecialStopsText>
        ) : (
          <></>
        )}
      </Dot>
      <RouteLines
        routeStatus={props.routeStatus}
        index={lineIndex[props.routeStatus].indexOf(props.item)}
        tab={props.tab}
      />
      <DotAnimation
        isOn={props.animationFlagTable[props.routeStatus][props.item]}
        index={props.item}
        color={props.item >= 5 ? 'orange' : routeToneTable[props.routeStatus]}
        routeStatus={props.routeStatus}
      />
    </RouteStations>
  )
}

const RouteElementGroup = (props: {
  routeStatus: RouteStatus
  tab: string
  animationFlagTable: { [key: string]: Array<boolean> }
}) => {
  return (
    <>
      {dotIndex[props.routeStatus]
        .filter(
          (item) => !(props.routeStatus !== 'direct' && item > 2 && item <= 4),
        )
        .map((item) => {
          if (item === 2 && props.routeStatus !== 'direct')
            return (
              <BranchRouteElementGroup key={item}>
                <RouteElement
                  routeStatus={props.routeStatus}
                  tab={props.tab}
                  animationFlagTable={props.animationFlagTable}
                  item={item}
                />
                <RouteElement
                  routeStatus={props.routeStatus}
                  tab={props.tab}
                  animationFlagTable={props.animationFlagTable}
                  item={item + 1}
                />
                <RouteElement
                  routeStatus={props.routeStatus}
                  tab={props.tab}
                  animationFlagTable={props.animationFlagTable}
                  item={item + 2}
                />
              </BranchRouteElementGroup>
            )
          return (
            <RouteElement
              key={item}
              routeStatus={props.routeStatus}
              tab={props.tab}
              animationFlagTable={props.animationFlagTable}
              item={item}
            />
          )
        })}
    </>
  )
}

const RouteVisual = (props: {
  routeStatus: keyof RouteAnimationFlag
  tab: string
}) => {
  const animationFlagTable = useDotAnimation(props.tab)

  return (
    <RouteElementGroup
      routeStatus={props.routeStatus}
      tab={props.tab}
      animationFlagTable={animationFlagTable}
    />
  )
}

export default RouteVisual
