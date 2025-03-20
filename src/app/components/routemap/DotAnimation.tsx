import React, { useEffect } from 'react'
import styled from 'styled-components'
import tw from 'twin.macro'

import { useTimeTableContext } from '@/context/TimeTableContext'
import {
  DotAnimationConfig,
  RouteAnimationFlag,
  SingleShuttleSchedule,
} from '@/data'

const PingDot = styled.div<{ $on: boolean }>`
  ${tw`animate-ping absolute rounded-full inline-flex h-3 w-3 rt1:h-2.5 rt1:w-2.5 z-[0] mx-2`}
  ${(props) => (props.$on ? tw`visible` : tw`invisible`)}
`

/**
 * This function applies the animation flag to the flagArray based on the config.
 * As a result, it controls the animation by passing the boolean values of the flagArray to each element accordingly.
 * @param config is the configuration object containing the animation starting index (index) and route type (dotType)
 * @param flagArray is the current animation flag array
 * @returns RouteAnimationFlag : Updated animation flag array
 *
 * @example If flagArray is all false and config is {dotType: 'direct', index: 2},
 * it should originally set true for indices 2 and 3 in the 'direct' array of flagArray,
 * but since there is no index 3 in dotIndex in RouteVisual, it sets true for indices 2 and 4 and returns it.
 */

export const applyDotAnimationFlag = (
  config: DotAnimationConfig,
  flagArray: RouteAnimationFlag,
) => {
  const newFlagArray = {
    direct: [...flagArray.direct],
    cycle: [...flagArray.cycle],
    yesulin: [...flagArray.yesulin],
    jungang: [...flagArray.jungang],
  }
  for (let i = config.index; i <= config.index + 1; i++) {
    if (config.dotType === 'direct')
      newFlagArray.direct[i >= 3 ? i + 1 : i] = true
    if (config.dotType === 'cycle') newFlagArray.cycle[i] = true
    if (config.dotType === 'yesulin')
      newFlagArray.yesulin[i === 2 ? 3 : i] = true
    if (config.dotType === 'jungang') newFlagArray.jungang[i] = true
  }
  return newFlagArray
}

// Function that returns a Config based on the timetableType
const getDotAniTimetableConfig = (type: string, index: number) => {
  if (type === 'C') return { dotType: 'cycle', index: index }
  else if (type === 'DHJ') return { dotType: 'jungang', index: index }
  else if (type === 'DY') return { dotType: 'yesulin', index: index }
  else return { dotType: 'direct', index: index }
}

/**
 * This function determines which route type and starting position the animation should use based on the tab and timetable type
 * @param tab is shuttle bus tabs such as 'shuttlecoke_o', 'subway'
 * @param currTimetable is current shuttle bus type and departure time from the timetable
 * @returns DotAnimationConfig[] : Array of configuration objects,
 * each containing animation starting index (index) and route type (dotType)
 *
 * @example If the tab is 'shuttlecoke_o' and the current timetable is {type: 'C', time: '~~:~~'},
 * then the function will return [{dotType: 'cycle', index: 1}]
 */

export const getDotAnimationConfig = (
  tab: string,
  currTimetable: SingleShuttleSchedule,
) => {
  if (currTimetable !== undefined) {
    switch (tab) {
      case 'shuttlecoke_o':
        return [getDotAniTimetableConfig(currTimetable.type, 1)]
      case 'subway':
        return [getDotAniTimetableConfig(currTimetable.type, 2)]
      case 'yesulin':
        return [getDotAniTimetableConfig(currTimetable.type, 3)]
      case 'jungang':
        return [
          {
            dotType: 'jungang',
            index: 3,
          },
        ]
      case 'shuttlecoke_i':
        if (currTimetable.type === 'NA') return []

        return [
          {
            dotType: 'direct',
            index: 3,
          },
          {
            dotType: 'jungang',
            index: 4,
          },
          {
            dotType: 'cycle',
            index: 4,
          },
          {
            dotType: 'yesulin',
            index: 4,
          },
        ]
      default:
        return [getDotAniTimetableConfig(currTimetable.type, 0)]
    }
  }
  return []
}

export const useDotAnimation = (tab: string) => {
  const [flagTable, setFlagTable] = React.useState<RouteAnimationFlag>({
    direct: [false, false, false, false, false, false],
    cycle: [false, false, false, false, false, false],
    yesulin: [false, false, false, false, false, false],
    jungang: [false, false, false, false, false, false],
  })
  const currTimetableArray = useTimeTableContext().currTimetable
  const checkCurrTimetable = React.useRef<SingleShuttleSchedule>()

  React.useEffect(() => {
    checkCurrTimetable.current = undefined
  }, [])

  useEffect(() => {
    let tempFlagTable = {
      direct: [false, false, false, false, false, false],
      cycle: [false, false, false, false, false, false],
      yesulin: [false, false, false, false, false, false],
      jungang: [false, false, false, false, false, false],
    }
    setFlagTable(tempFlagTable)

    if (checkCurrTimetable.current === currTimetableArray[0]) return

    checkCurrTimetable.current = currTimetableArray[0]

    currTimetableArray.map((currTimetable: SingleShuttleSchedule) => {
      const dotAnimationConfig = getDotAnimationConfig(tab, currTimetable)

      dotAnimationConfig.forEach((config) => {
        tempFlagTable = applyDotAnimationFlag(config, tempFlagTable)
      })
    })

    setFlagTable(tempFlagTable)
  }, [currTimetableArray, tab])

  return flagTable
}

const DotAnimation = (props: {
  isOn: boolean
  index: number
  color: string
  rootStatus: string
}) => {
  if (props.rootStatus === 'yesulin' && props.index === 2) return

  return <PingDot className={props.color} $on={props.isOn} />
}

export default DotAnimation
