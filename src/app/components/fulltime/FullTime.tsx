import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import tw from 'twin.macro'

import ArrowImg from '/public/image/arrow_back_black_36dp.svg?react'
import CheckImg from '/public/image/selected2.svg?react'
import { useDarkmodeContext } from '@/context/ThemeContext'
import {
  OrganizedTimetables,
  Season,
  SingleShuttleSchedule,
  StopLocation,
  Week,
} from '@/data'
import { seasonKeys } from '@/data/shuttle/season'
import { weekKeys } from '@/data/shuttle/week'
import { shuttleAPI } from '@/network'

import { useDarkMode } from '../useDarkMode'

const Chip = styled.div`
  ${tw`self-center h-fit text-black py-1 w-12 rounded-full inline-block text-center hm:w-10 hm:py-0.5 tracking-tighter`}
`

const ComboBoxContainer = styled.div`
  ${tw`flex gap-2 flex-wrap`}
`

const ComboBoxInner = styled.div<{
  $comboType: string
  $comboValue: StopLocation | Season | Week
}>`
  ${tw`flex cursor-default font-medium text-sm items-center py-2 px-4 rounded-xl border border-solid hm:text-xs hm:py-1.5 hm:px-3 hm:rounded-lg`}
  ${({ $comboType, $comboValue }) => {
    if ($comboType === $comboValue) {
      return tw`pl-2 text-ft-active-text bg-ft-active border-ft-active hm:pl-1.5` // Selected
    } else {
      return tw`text-ft-text border-ft-border` // Not Selected
    }
  }}
`

const ControlBox = styled.div`
  ${tw`h-full scroll-smooth`}
`

const ControlBoxDivider = styled.hr`
  ${tw`w-full h-px mb-3 border-ft-border bg-center justify-center`}
`

const ControlBoxRow = styled.div`
  ${tw`grid grid-flow-row gap-2`}
`

const ControlBoxRowTitle = styled.span`
  ${tw`text-left font-bold text-lg hm:text-base`}
`

const NoTimetable = styled.div`
  ${tw`h-32 hm:h-24 bg-ft-element rounded-2xl text-lg leading-[8rem] hm:leading-[6rem]`}
`

const MinuteContainer = styled.div`
  ${tw`self-center text-left ml-3 col-span-4`}
`

const DirectMinuteContainer = styled(MinuteContainer)`
  ${tw`hm:leading-none`}
`

const FullTimeDocument = styled.div`
  ${tw`px-5 font-Ptd text-center mx-auto select-none bg-theme-main text-theme-text max-w-7xl`}
`

const FullTimeToolbar = styled.div`
  ${tw`flex self-center py-5 hm:py-3`}
`

const FullTimeTitle = styled.span`
  ${tw`text-left font-bold text-2xl px-1 hm:text-xl hm:px-0.5`}
`

const GoBackIcon = styled(ArrowImg)`
  ${tw`cursor-default w-6 mr-2 hm:w-4`}
`

const SelectedIcon = styled(CheckImg)`
  ${tw`mr-1 w-5 h-2.5 hm:w-4`}
`

const TimeBoxInner = styled.div<{ $maxChips: number }>`
  ${tw`bg-ft-element rounded-2xl grid grid-cols-6 p-5 hm:p-2.5 hm:text-sm`}
  ${({ $maxChips }) => {
    if ($maxChips === 1) {
      return tw`h-24 hm:h-20`
    } else if ($maxChips === 2) {
      return tw`h-28 hm:h-24`
    } else if ($maxChips === 3) {
      return tw`h-32 hm:h-28`
    } else if ($maxChips === 4) {
      return tw`h-40 hm:h-32`
    }
  }}
`

const TimeBoxHeader = styled.div`
  ${tw`font-bold self-center`}
`

const TimeBoxBody = styled.div`
  ${tw`font-medium inline-grid grid-flow-row gap-2 col-span-5 hm:gap-px`}
`

const TimeBoxBodyGrid = styled.div<{ $itemCount: number }>`
  ${tw`inline-grid grid-cols-5`}
  ${({ $itemCount }) => ($itemCount === 0 ? tw`hidden` : undefined)}
`

const TimetableContainer = styled.div`
  ${tw`pb-6`}
`

const ComboBox = (props: {
  type: string
  value: StopLocation | Season | Week
  func: (arg: StopLocation | Season | Week) => void
  info: string
}) => {
  const handleContextMenu = (e: { preventDefault: () => void }) => {
    e.preventDefault()
  }

  return (
    <>
      <ComboBoxInner
        $comboType={props.type}
        $comboValue={props.value}
        onClick={() => props.func(props.value)}
      >
        {props.type === props.value ? (
          <SelectedIcon
            //src="../image/selected.svg"
            //alt="check"
            fill='var(--color-ft-selected)'
            onContextMenu={handleContextMenu}
          />
        ) : null}
        {props.info}
      </ComboBoxInner>
    </>
  )
}

const TimeBox = (props: OrganizedTimetables) => {
  const { t } = useTranslation()
  return (
    <>
      <TimeBoxInner $maxChips={props.count}>
        <TimeBoxHeader>
          {props.time}
          {t('o_clock')}
        </TimeBoxHeader>
        <TimeBoxBody>
          <TimeBoxBodyGrid $itemCount={props.circle.length}>
            <Chip className="bg-chip-red">{t('cycle')}</Chip>
            <MinuteContainer>{props.circle.join(' ')}</MinuteContainer>
          </TimeBoxBodyGrid>
          <TimeBoxBodyGrid $itemCount={props.jungang.length}>
            <Chip className="bg-chip-purple">{t('cycle_ja')}</Chip>
            <MinuteContainer>{props.jungang.join(' ')}</MinuteContainer>
          </TimeBoxBodyGrid>
          <TimeBoxBodyGrid $itemCount={props.directY.length}>
            <Chip className="bg-chip-green">{t('yesul')}</Chip>
            <MinuteContainer>{props.directY.join(' ')}</MinuteContainer>
          </TimeBoxBodyGrid>
          <TimeBoxBodyGrid $itemCount={props.direct.length}>
            <Chip className={props.isShuttleI?"bg-chip-orange":"bg-chip-blue"}>{t('direct')}</Chip>
            <DirectMinuteContainer>
              {props.direct.map((time, idx) => {
                let isExist = false
                props.directY.map((ytime) => {
                  time === ytime ? (isExist = true) : null
                })
                return(
                  isExist ? null :
                <React.Fragment key={idx}>
                  <span>{time} </span>
                </React.Fragment>
                )
              })}
            </DirectMinuteContainer>
          </TimeBoxBodyGrid>
        </TimeBoxBody>
      </TimeBoxInner>
    </>
  )
}

const FullTime = () => {
  const [season, setSeason] = useState<Season>(
    (window.localStorage.getItem('season') as Season) || 'semester',
  )
  const [week, setWeek] = useState<Week>(
    (window.localStorage.getItem('week') as Week) || 'week',
  )
  const [location, setLocation] = useState<StopLocation>(
    (window.localStorage.getItem('tab') as StopLocation) || 'shuttlecoke_o',
  )
  const timetable = useQuery({
    queryKey: ['fullTime', season, week, location],
    queryFn: async () => await shuttleAPI(season, week, location),
    staleTime: 5 * 60 * 1000,
  })

  const [countChip, setCountChip] = useState(0)
  const { theme } = useDarkmodeContext()
  const { setBackground } = useDarkMode()
  const navigate = useNavigate()
  const { t } = useTranslation()
  // let minute: TimeTables = { DH: [], DY: [], C: [], R: [], N: [], NA: [] }
  // let hour = '00'

  const renderTimeBox = () => {
    if (timetable.data?.length === 0) {
      return <NoTimetable>{t('none_data')}</NoTimetable>
    }

    const timetableFiltered: Map<
      string,
      Array<SingleShuttleSchedule>
    > = new Map()
    // Key: 시간, Value: 일정 [{"time": "HH:MM", "type": "DH"}]

    timetable.data?.forEach((schedule) => {
      const spt = schedule.time.split(':')
      const hour = spt[0]

      if (timetableFiltered.has(hour)) {
        timetableFiltered.get(hour)?.push(schedule)
      } else {
        timetableFiltered.set(hour, [schedule])
      }
    })

    const filteredByType: Array<OrganizedTimetables> = []

    timetableFiltered.forEach((schedules, hour) => {
      const single: OrganizedTimetables = {
        time: hour,
        direct: [],
        circle: [],
        directY: [],
        jungang: [],
        isShuttleI: false,
        count: 0,
      }
      schedules.forEach((schedule) => {
        if (
          schedule.type === 'DH' ||
          schedule.type === 'R' ||
          schedule.type === ''
        ) {
          single.direct.push(schedule.time.split(':')[1])
        } else if (schedule.type === 'DY') {
          single.directY.push(schedule.time.split(':')[1])
        } else if (schedule.type === 'C') {
          single.circle.push(schedule.time.split(':')[1])
        } else if (schedule.type === 'DHJ') {
          single.jungang.push(schedule.time.split(':')[1])
        } 
        if (schedule.type === 'R'){
          single.isShuttleI = true
        }
      })

      if (single.circle.length !== 0) {
        single.count++
      }
      if (single.direct.length !== 0) {
        single.count++
      }
      if (single.jungang.length !== 0) {
        single.count++
      }
      if (single.directY.length !== 0) {
        single.count++
      }

      filteredByType.push(single)
      return <></>
      // [{ time: '08', direct: ["08:00", "08:10", ...], circle: [], directY: ["08:20", "08:50"] }, { time: '09', direct: [], circle: [], directY: [] }, ...]
    })
  
    const maxCount = filteredByType.reduce(
      (prev, curr) => (prev.count > curr.count ? prev : curr),
      { count: 0 },
    ).count

    if (maxCount > countChip) {
      setCountChip(maxCount)
    }
    
    return (
      <div className="grid grid-flow-row gap-2">
        {filteredByType.map((schedule) => {
          // if schedule.direct.length === 0
          return (
            <React.Fragment key={schedule.time}>
              {schedule.direct.length + schedule.circle.length === 0 && (schedule.directY.length === 0 && schedule.jungang.length === 0) ? null : (
                <TimeBox
                  time={schedule.time}
                  direct={schedule.direct}
                  directY={schedule.directY}
                  circle={schedule.circle}
                  jungang={schedule.jungang}
                  isShuttleI={schedule.isShuttleI}
                  count={countChip}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  useLayoutEffect(() => {
    setBackground()
  })

  useEffect(() => {
    if (season === seasonKeys.HALT) {
      setSeason(seasonKeys.SEMESTER)
    }

    if (week === weekKeys.UNKNOWN) {
      setWeek(weekKeys.WEEK)
    }
  }, [season, week])

  useEffect(() => {
    if (timetable.status !== 'pending') {
      setCountChip(0)
    }
  }, [timetable.status, season, week, location]) // When timetable is changed, the max chip counts has to be recalculated.

  const arrLocation: Array<[StopLocation, string]> = [
    ['shuttlecoke_o', t('shuttlecoke_o')],
    ['subway', t('dest_subway')],
    ['jungang', t('dest_jungang')],
    ['yesulin', t('dest_yesul')],
    ['residence', t('dest_dorm')],
    ['shuttlecoke_i', t('shuttlecoke_i')],
  ]

  const arrSeason: Array<[Season, string]> = [
    ['semester', t('semester')],
    ['vacation', t('vacation')],
    ['vacation_session', t('vacation_session')],
  ]

  const arrWeek: Array<[Week, string]> = [
    ['week', t('week')],
    ['weekend', t('weekend')],
  ]
  const handleContextMenu = (e: { preventDefault: () => void }) => {
    e.preventDefault()
  }

  const goToHomeScreen = () => {
    if (window.history.state && window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <>
      <div className={`${theme}`}>
        <FullTimeDocument>
          <FullTimeToolbar>
            <GoBackIcon
              //src="../image/arrow_back_black_36dp.svg"
              //alt="back page"
              fill='var(--color-theme-text)'
              onClick={() => goToHomeScreen()}
              onContextMenu={handleContextMenu}
            />
            <FullTimeTitle>{t('all_btn')}</FullTimeTitle>
          </FullTimeToolbar>
          <ControlBox>
            <ControlBoxRow>
              <ControlBoxRowTitle>{t('bus_stop')}</ControlBoxRowTitle>
              <ComboBoxContainer>
                {arrLocation.map((i) => {
                  return (
                    <React.Fragment key={i[0]}>
                      <ComboBox
                        type={location}
                        value={i[0]}
                        func={() => setLocation(i[0])}
                        info={i[1]}
                      />
                    </React.Fragment>
                  )
                })}
              </ComboBoxContainer>
              <ControlBoxDivider />
            </ControlBoxRow>
            <ControlBoxRow>
              <ControlBoxRowTitle>{t('period')}</ControlBoxRowTitle>
              <ComboBoxContainer>
                {arrSeason.map((i) => {
                  return (
                    <React.Fragment key={i[0]}>
                      <ComboBox
                        type={season}
                        value={i[0]}
                        func={() => setSeason(i[0])}
                        info={i[1]}
                      />
                    </React.Fragment>
                  )
                })}
                <ControlBoxDivider />
              </ComboBoxContainer>
            </ControlBoxRow>
            <ControlBoxRow>
              <ControlBoxRowTitle>{t('days_week')}</ControlBoxRowTitle>
              <ComboBoxContainer>
                {arrWeek.map((i) => {
                  return (
                    <React.Fragment key={i[0]}>
                      <ComboBox
                        type={week}
                        value={i[0]}
                        func={() => setWeek(i[0])}
                        info={i[1]}
                      />
                    </React.Fragment>
                  )
                })}
                <ControlBoxDivider />
              </ComboBoxContainer>
            </ControlBoxRow>
          </ControlBox>
          <TimetableContainer>{renderTimeBox()}</TimetableContainer>
        </FullTimeDocument>
      </div>
    </>
  )
}

export default FullTime
