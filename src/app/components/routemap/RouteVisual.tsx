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

const AddLines = (props: {
  rootStatus: string
  index: number
  tab: string
}) => {
  if (props.index === -1) return
  const index = lineIndex[props.rootStatus][props.index]
  return (
    <RouteLine
      $ishalfwidth={
        props.rootStatus !== 'direct' && (index === 2 || index === 3)
      }
      className={
        isPrevStop(props.rootStatus, index, props.tab)
          ? index === 4
            ? 'bg-chip-orange'
            : routeColorTable[props.rootStatus]
          : 'bg-zinc-200 dark:bg-slate-500'
      }
    />
  )
}

const AddElements = (props: {
  rootStatus: string
  tab: string
  animationFlagTable: { [key: string]: Array<boolean> }
}) => {
  const { t, i18n } = useTranslation()
  const arrDots: Array<React.JSX.Element> = []
  const arrChild: Array<React.JSX.Element> = []

  dotIndex[props.rootStatus].forEach((item) => {
    arrDots.push(
      <RouteStations key={item}>
        <Dot
          className={
            (isPrevStop(props.rootStatus, item, props.tab)
              ? item >= 5
                ? 'bg-chip-orange'
                : routeColorTable[props.rootStatus]
              : 'bg-zinc-200 dark:bg-slate-500') +
            (item === 2 && props.rootStatus === 'yesulin' ? ' opacity-0' : '')
          }
        >
          {item === 3 ? (
            <SpecialStopsText
              key={0}
              lang={i18n.language}
              className={
                isPrevStop(props.rootStatus, item, props.tab)
                  ? routeColorTable[props.rootStatus + 'Text']
                  : 'text-zinc-200 dark:text-slate-500'
              }
            >
              {props.rootStatus === 'jungang' ? t('jung') : t('yesul')}
            </SpecialStopsText>
          ) : (
            <></>
          )}
        </Dot>
        <AddLines
          rootStatus={props.rootStatus}
          index={lineIndex[props.rootStatus].indexOf(item)}
          tab={props.tab}
        />
        <DotAnimation
          isOn={props.animationFlagTable[props.rootStatus][item]}
          index={item}
          color={
            item >= 5 ? 'bg-chip-orange' : routeColorTable[props.rootStatus]
          }
          rootStatus={props.rootStatus}
        />
      </RouteStations>,
    )
  })

  return (
    <>
      {arrDots.map((element: React.JSX.Element, index) => {
        if (index >= 2 && index <= 4 && props.rootStatus !== 'direct') {
          arrChild.push(element)
          if (index === 4) {
            return (
              <div
                key={index}
                className="col-span-2 grid grid-cols-3 w-[75%] place-items-center"
              >
                {arrChild.map((element) => {
                  return element
                })}
              </div>
            )
          }
        } else return element
      })}
    </>
  )
}

const RouteVisual = (props: {
  rootStatus: keyof RouteAnimationFlag
  tab: string
}) => {
  const animationFlagTable = useDotAnimation(props.tab)

  return (
    <AddElements
      rootStatus={props.rootStatus}
      tab={props.tab}
      animationFlagTable={animationFlagTable}
    />
  )
}

export default RouteVisual
