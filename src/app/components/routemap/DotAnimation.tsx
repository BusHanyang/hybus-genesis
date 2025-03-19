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
      newFlagArray.yesulin[i === 2 ? i + 1 : i] = true
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

export const getDotAnimationConfig = (
  tab: string,
  timetable: SingleShuttleSchedule,
) => {
  if (timetable?.time !== '') {
    switch (tab) {
      case 'shuttlecoke_o':
        return [getDotAniTimetableConfig(timetable.type, 1)]
      case 'subway':
        return [getDotAniTimetableConfig(timetable.type, 2)]
      case 'yesulin':
        return [getDotAniTimetableConfig(timetable.type, 3)]
      case 'jungang':
        return [
          {
            dotType: 'jungang',
            index: 3,
          },
        ]
      case 'shuttlecoke_i':
        if (timetable.type === 'NA') return []

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
            index: 3,
          },
        ]
      default:
        return [getDotAniTimetableConfig(timetable.type, 0)]
    }
  }
  return []
}

export const useDotAnimation = (tab: string) => {
  const [flagTable, setFlagTable] = React.useState<RouteAnimationFlag>({
    direct: [false, false, false, false, false],
    cycle: [false, false, false, false, false, false],
    yesulin: [false, false, false, false, false],
    jungang: [false, false, false, false, false, false],
  })
  const timetable = useTimeTableContext().timetable
  const checkTimetable = React.useRef<SingleShuttleSchedule>()

  React.useEffect(() => {
    checkTimetable.current = undefined
  }, [])

  useEffect(() => {
    let tempFlagTable = {
      direct: [false, false, false, false, false],
      cycle: [false, false, false, false, false, false],
      yesulin: [false, false, false, false, false],
      jungang: [false, false, false, false, false, false],
    }
    setFlagTable(tempFlagTable)
    if (checkTimetable.current === timetable) return

    checkTimetable.current = timetable

    const dotAnimationConfig = getDotAnimationConfig(tab, timetable)

    dotAnimationConfig.forEach((config) => {
      tempFlagTable = applyDotAnimationFlag(config, tempFlagTable)
    })

    setFlagTable(tempFlagTable)
  }, [timetable, tab])

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
