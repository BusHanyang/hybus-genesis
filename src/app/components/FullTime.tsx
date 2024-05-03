import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import tw from 'twin.macro'

import { THEME, useDarkmodeContext } from '@/context/ThemeContext'
import {
  OrganizedTimetables,
  Season,
  SingleShuttleSchedule,
  StopLocation,
  Week,
} from '@/data'
import { shuttleAPI } from '@/network'

import { useDarkMode } from './useDarkMode'

const Chip = styled.div`
  ${tw`self-center h-fit dark:text-black py-1 w-12 rounded-full inline-block text-center hm:w-10 hm:py-0.5 tracking-tighter`}
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
      return tw`pl-2 text-[#141B2C] bg-[#DBE2F9] border-[#DBE2F9] dark:text-[#DBE2F9] dark:bg-[#3F4759] dark:border-[#3F4759] hm:pl-1.5` // Selected
    } else {
      return tw`text-[#44464E] border-[#75777F]  dark:text-[#C5C6D0] dark:border-[#8E9099]` // Not Selected
    }
  }}
`

const ControlBox = styled.div`
  ${tw`h-full scroll-smooth`}
`

const ControlBoxDivider = styled.hr`
  ${tw`w-full h-px mb-3 border-slate-400 bg-center justify-center`}
`

const ControlBoxRow = styled.div`
  ${tw`grid grid-flow-row gap-2`}
`

const ControlBoxRowTitle = styled.span`
  ${tw`text-left font-bold text-lg hm:text-base`}
`

const NoTimetable = styled.div`
  ${tw`h-32 hm:h-24 bg-[#E1E2EC] dark:bg-[#44464E] rounded-2xl text-lg leading-[8rem] hm:leading-[6rem]`}
`

const MinuteContainer = styled.div`
  ${tw`self-center text-left ml-3 col-span-4`}
`

const DirectMinuteContainer = styled(MinuteContainer)`
  ${tw`hm:leading-none`}
`

const FullTimeDocument = styled.div`
  ${tw`px-5 bg-white text-black font-Ptd text-center mx-auto select-none dark:bg-zinc-800 dark:text-white max-w-7xl`}
`

const FullTimeToolbar = styled.div`
  ${tw`flex self-center py-5 hm:py-3`}
`

const FullTimeTitle = styled.span`
  ${tw`text-left font-bold text-2xl px-1 hm:text-xl hm:px-0.5`}
`

const GoBackIcon = styled.img`
  ${tw`cursor-default dark:invert w-6 mr-2 hm:w-4`}
`

const SelectedIcon = styled.img`
  ${tw`dark:invert mr-1 w-5 hm:w-4`}
`

const TimeBoxInner = styled.div<{ $maxChips: number }>`
  ${tw`bg-[#E1E2EC] dark:bg-[#44464E] rounded-2xl grid grid-cols-6 p-5 hm:p-2.5 hm:text-sm`}
  ${({ $maxChips }) => {
    if ($maxChips === 1) {
      return tw`h-24 hm:h-20`
    } else if ($maxChips === 2) {
      return tw`h-28 hm:h-24`
    } else if ($maxChips === 3) {
      return tw`h-32 hm:h-28`
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

const YesulinMinuteWrapper = styled.span<{ $itemCount: number }>`
  ${tw`inline-block text-green-500`}
  ${({ $itemCount }) => ($itemCount === 0 ? tw`hidden` : undefined)}
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
            src="../image/selected.svg"
            alt="check"
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
          <TimeBoxBodyGrid $itemCount={props.direct.length}>
            <Chip className="bg-chip-blue">{t('direct')}</Chip>
            <DirectMinuteContainer>
              {props.direct.map((time, idx) => {
                return (
                  <React.Fragment key={idx}>
                    <span>{time} </span>
                  </React.Fragment>
                )
              })}
              <YesulinMinuteWrapper $itemCount={props.directY.length}>
                {`${props.directY.join(' ')} (${t('to_yesulin')})`}
              </YesulinMinuteWrapper>
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
              {schedule.direct.length + schedule.circle.length === 0 ? null : (
                <TimeBox
                  time={schedule.time}
                  direct={schedule.direct}
                  directY={schedule.directY}
                  circle={schedule.circle}
                  jungang={schedule.jungang}
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
      <div className={`${theme === THEME.DARK ? 'dark' : ''}`}>
        <FullTimeDocument>
          <FullTimeToolbar>
            <GoBackIcon
              src="../image/arrow_back_black_36dp.svg"
              alt="back page"
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
