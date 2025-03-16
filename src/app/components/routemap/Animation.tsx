import React from 'react'
import styled from 'styled-components'
import tw from 'twin.macro'

import { CircleAnimate, SingleShuttleSchedule } from '@/data'

const PingCircle = styled.div<{ $on: boolean }>`
  ${tw`animate-ping absolute rounded-full inline-flex h-3 w-3 rt1:h-2.5 rt1:w-2.5 z-[0] mx-2`}
  ${(props) => (props.$on ? tw`` : tw`!opacity-0 !scale-0`)}
`

export const circleAnimation = (
  type: CircleAnimate,
  setTableArray: React.Dispatch<
    React.SetStateAction<{
      direct: boolean[]
      cycle: boolean[]
      yesulin: boolean[]
      jungang: boolean[]
    }>
  >,
  tabArray: {
    direct: boolean[]
    cycle: boolean[]
    yesulin: boolean[]
    jungang: boolean[]
  },
) => {
  const tableArray = tabArray
  for (let i = type.index; i <= type.index + 1; i++) {
    if (type.dotType === 'direct') {
      tableArray.direct[i] = true
    } else if (type.dotType === 'cycle') {
      tableArray.cycle[i] = true
    } else if (type.dotType === 'yesulin') {
      tableArray.yesulin[i] = true
    } else if (type.dotType === 'jungang') {
      tableArray.jungang[i] = true
    }
  }
  console.log(tableArray)
  setTableArray(tableArray)
}

const timetableType = (type: string, index: number) => {
  if (type === 'C') return { dotType: 'cycle', index: index }
  else if (type === 'DHJ') return { dotType: 'jungang', index: index }
  else if (type === 'DY') return { dotType: 'yesulin', index: index }
  else return { dotType: 'direct', index: index }
}

export const CircleAnimateType = (
  tab: string,
  timetable: SingleShuttleSchedule,
) => {
  if (timetable?.time !== '') {
    switch (tab) {
      case 'shuttlecoke_o':
        return [timetableType(timetable.type, 1)]
      case 'subway':
        return [timetableType(timetable.type, 2)]
      case 'yesulin':
        return [timetableType(timetable.type, 3)]
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
        return [timetableType(timetable.type, 0)]
    }
  }
  return []
}

const Animation = (props: {
  isOn: boolean
  index: number
  rootStatus: string
}) => {
  switch (props.rootStatus) {
    case 'direct':
      if (props.index === 4)
        return <PingCircle className="bg-chip-orange" $on={props.isOn} />
      return <PingCircle className="bg-chip-blue" $on={props.isOn} />
    case 'cycle':
      if (props.index === 5)
        return <PingCircle className="bg-chip-orange" $on={props.isOn} />
      return <PingCircle className="bg-chip-red" $on={props.isOn} />
    case 'yesulin':
      if (props.index === 4)
        return <PingCircle className="bg-chip-orange" $on={props.isOn} />
      return <PingCircle className="bg-chip-green" $on={props.isOn} />
    case 'jungang':
      if (props.index === 5)
        return <PingCircle className="bg-chip-orange" $on={props.isOn} />
      return <PingCircle className="bg-chip-purple" $on={props.isOn} />
    default:
      return <></>
  }
}

export default Animation
