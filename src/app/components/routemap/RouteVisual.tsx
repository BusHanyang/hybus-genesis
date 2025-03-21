import React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import tw from 'twin.macro'

import DotAnimation, {
  useDotAnimation,
} from '@/components/routemap/DotAnimation'
import { RouteAnimationFlag } from '@/data'

const RouteLine = styled.div<{ $ishalfwidth: boolean }>`
  ${tw`absolute transition duration-150 ease-in-out z-0 h-[0.2rem] top-1 rt1:top-[0.2rem] rt1:h-[0.16rem] left-[0.6rem] max-w-[13.125rem]`}
  ${(props) => (props.$ishalfwidth ? tw`w-[7.8vw]` : tw`w-[15.6vw]`)}
`

const Dot = styled.span`
  ${tw`
        flex rounded-full inline-block
        h-3 w-3 rt1:h-2.5 rt1:w-2.5
        z-1 mx-2
    `}
`

const RouteStations = styled.div`
  ${tw`transition duration-150 ease-in-out flex relative`}
`

const SpecialStopsText = styled.p<{ key: number; lang: string }>`
  ${tw`absolute text-xs top-[-17px] left-[-6.5px] text-center w-10 font-bold`}
  ${(props) =>
    props.lang === 'ko'
      ? tw`tracking-tight`
      : tw`tracking-tighter text-[0.7rem]`}
`

const routeColorTable: { [key: string]: string } = {
  direct: 'bg-chip-blue',
  cycle: 'bg-chip-red',
  yesulin: 'bg-chip-green',
  jungang: 'bg-chip-purple',
  cycleText: 'text-chip-red',
  yesulinText: 'text-chip-green',
  jungangText: 'text-chip-purple',
}

// The numbers in lineIndex and dotIndex represent the index numbers for each route.
// The 'direct' route does not have an index 3 because,
// while the other routes include an extra stop(station) at that position (such as yesulin or jungang),
// the 'direct' route does not have an additional stop(station) there.
const lineIndex: { [key: string]: Array<number> } = {
  direct: [0, 1, 2, 4],
  cycle: [0, 1, 2, 3, 4],
  yesulin: [0, 1, 2, 3, 4],
  jungang: [0, 1, 2, 3, 4],
}

const dotIndex: { [key: string]: Array<number> } = {
  direct: [0, 1, 2, 4, 5],
  cycle: [0, 1, 2, 3, 4, 5],
  yesulin: [0, 1, 2, 3, 4, 5],
  jungang: [0, 1, 2, 3, 4, 5],
}

const isPrevStop = (line: string, index: number, tab: string) => {
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

const RouteLines = (props: {
  routeStatus: string
  index: number
  tab: string
}) => {
  if (props.index === -1) return
  const index = lineIndex[props.routeStatus][props.index]
  return (
    <RouteLine
      $ishalfwidth={
        props.routeStatus !== 'direct' && (index === 2 || index === 3)
      }
      className={
        isPrevStop(props.routeStatus, index, props.tab)
          ? index === 4
            ? 'bg-chip-orange'
            : routeColorTable[props.routeStatus]
          : 'bg-zinc-200 dark:bg-slate-500'
      }
    />
  )
}

const RouteElement = (props: {
  routeStatus: string
  tab: string
  animationFlagTable: { [key: string]: Array<boolean> }
  item: number
}) => {
  const { t, i18n } = useTranslation()

  return (
    <RouteStations>
      <Dot
        className={
          (isPrevStop(props.routeStatus, props.item, props.tab)
            ? props.item >= 5
              ? 'bg-chip-orange'
              : routeColorTable[props.routeStatus]
            : 'bg-zinc-200 dark:bg-slate-500') +
          (props.item === 2 && props.routeStatus === 'yesulin'
            ? ' opacity-0'
            : '')
        }
      >
        {props.item === 3 ? (
          <SpecialStopsText
            key={0}
            lang={i18n.language}
            className={
              isPrevStop(props.routeStatus, props.item, props.tab)
                ? routeColorTable[props.routeStatus + 'Text']
                : 'text-zinc-200 dark:text-slate-500'
            }
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
        color={
          props.item >= 5
            ? 'bg-chip-orange'
            : routeColorTable[props.routeStatus]
        }
        routeStatus={props.routeStatus}
      />
    </RouteStations>
  )
}

const RouteElementGroup = (props: {
  routeStatus: string
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
              <div
                key={item}
                className={
                  'col-span-2 grid grid-cols-3 w-[75%] place-items-center'
                }
              >
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
              </div>
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
