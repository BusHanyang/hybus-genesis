import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

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
      <div
        className={`flex cursor-default font-medium text-sm items-center py-2 px-4 rounded-xl border border-solid hm:text-xs hm:py-1.5 hm:px-3 hm:rounded-lg ${
          props.type === props.value
            ? 'pl-2 text-[#141B2C] bg-[#DBE2F9] border-[#DBE2F9]  dark:text-[#DBE2F9] dark:bg-[#3F4759] dark:border-[#3F4759] hm:pl-1.5' // Selected
            : 'text-[#44464E] border-[#75777F]  dark:text-[#C5C6D0] dark:border-[#8E9099]' // Not Selected
        }`}
        onClick={() => props.func(props.value)}
      >
        {props.type === props.value ? (
          <img
            className="dark:invert mr-1 w-5 hm:w-4"
            src="../image/done_FILL0_wght600_GRAD0_opsz48.svg"
            alt="check"
            onContextMenu={handleContextMenu}
          />
        ) : null}
        {props.info}
      </div>
    </>
  )
}

const TimeBox = (props: OrganizedTimetables) => {
  const { t } = useTranslation()
  return (
    <>
      <div
        className={`h-${
          props.count
        } bg-[#E1E2EC] dark:bg-[#44464E] rounded-2xl grid grid-cols-6 p-5 hm:h-${
          props.count - 4
        } hm:p-2.5 hm:text-sm`}
      >
        <div className="font-bold self-center">
          {props.time}
          {t('o_clock')}
        </div>
        <div className="font-medium inline-grid grid-flow-row gap-2 col-span-5 hm:gap-px">
          <div
            className={`inline-grid grid-cols-5 ${
              props.circle.length === 0 ? 'hidden' : 'block'
            }`}
          >
            <div className="self-center bg-chip-red h-fit dark:text-black py-1 w-12 rounded-full inline-block text-center hm:w-10 hm:py-0.5">
              {t('cycle')}
            </div>
            <div className="self-center text-left ml-3 col-span-4">
              {props.circle.join(' ')}
            </div>
          </div>
          <div
            className={`inline-grid grid-cols-5 ${
              props.jungang.length === 0 ? 'hidden' : 'block'
            }`}
          >
            <div className="self-center bg-chip-purple h-fit  dark:text-black py-1 w-12 rounded-full inline-block text-center hm:w-10 hm:py-0.5">
              {t('cycle_ja')}
            </div>
            <div className="self-center text-left ml-3 col-span-4">
              {props.jungang.join(' ')}
            </div>
          </div>
          <div
            className={`inline-grid grid-cols-5 ${
              props.direct.length === 0 ? 'hidden' : 'block'
            }`}
          >
            <div className="self-center bg-chip-blue h-fit  dark:text-black py-1 w-12 rounded-full inline-block text-center  hm:w-10 hm:py-0.5">
              {t('direct')}
            </div>
            <div className="self-center text-left ml-3 col-span-4 hm:leading-none">
              {props.direct.map((time, idx) => {
                return (
                  <React.Fragment key={idx}>
                    <span>{time} </span>
                  </React.Fragment>
                )
              })}
              <span
                className={`inline-block ${
                  props.directY.length === 0 ? 'hidden' : 'text-green-500'
                }`}
              >
                {`${props.directY.join(' ')} (${t('to_yesulin')})`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const FullTime = () => {
  const [season, setSeason] = useState<Season>(
    (window.localStorage.getItem('season') as Season) || 'semester'
  )
  const [week, setWeek] = useState<Week>(
    (window.localStorage.getItem('week') as Week) || 'week'
  )
  const [location, setLocation] = useState<StopLocation>(
    (window.localStorage.getItem('tab') as StopLocation) || 'shuttlecoke_o'
  )
  const timetable = useQuery({
    queryKey: ['shuttle', season, week, location],
    queryFn: async () => await shuttleAPI(season, week, location),
  })

  const [countChip, setCountChip] = useState(0)
  const { theme } = useDarkmodeContext()
  const { setBackground } = useDarkMode()
  const navigate = useNavigate()
  const { t } = useTranslation()
  // let minute: TimeTables = { DH: [], DY: [], C: [], R: [], N: [], NA: [] }
  // let hour = '00'

  const changeLocation = (value: StopLocation) => {
    setLocation(value)
    return
  }
  const changeSeason = (value: Season) => {
    setSeason(value)
    return
  }
  const changeWeek = (value: Week) => {
    setWeek(value)
    return
  }

  const renderTimeBox = () => {
    if (timetable.data?.length === 0) {
      return (
        <div className="min-h-screen">
          <div className="h-32 hm:h-24 bg-[#E1E2EC] dark:bg-[#44464E] rounded-2xl text-lg leading-[8rem] hm:leading-[6rem]">
            {t('none_data')}
          </div>
        </div>
      )
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

      single.count > countChip ? setCountChip(single.count) : null
      filteredByType.push(single)
      return <></>
      // [{ time: '08', direct: ["08:00", "08:10", ...], circle: [], directY: ["08:20", "08:50"] }, { time: '09', direct: [], circle: [], directY: [] }, ...]
    })

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
                  count={20 + countChip * 4}
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
  }, [timetable.status])

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
  return (
    <>
      <div className={`${theme === THEME.DARK ? 'dark' : ''}`}>
        <div className="px-5 bg-white text-black font-Ptd text-center mx-auto select-none dark:bg-zinc-800 dark:text-white max-w-7xl">
          <div className="flex self-center py-5 hm:py-3">
            <img
              src="../image/arrow_back_black_36dp.svg"
              alt="back page"
              className="cursor-default dark:invert w-6 mr-2 hm:w-4"
              onClick={() => {
                if (window.history.state && window.history.state.idx > 0) {
                  navigate(-1)
                } else {
                  navigate('/', { replace: true })
                }
              }}
              onContextMenu={handleContextMenu}
            />
            <span className="text-left font-bold text-2xl px-1 hm:text-xl hm:px-0.5">
              {t('all_btn')}
            </span>
          </div>
          <div className=" h-full scroll-smooth	">
            <div className=" grid grid-flow-row gap-2 ">
              <span className="text-left font-bold text-lg hm:text-base">
                {t('bus_stop')}
              </span>
              <div className="flex gap-2 flex-wrap">
                {arrLocation.map((i) => {
                  return (
                    <React.Fragment key={i[0]}>
                      <ComboBox
                        type={location}
                        value={i[0]}
                        func={() => changeLocation(i[0])}
                        info={i[1]}
                      />
                    </React.Fragment>
                  )
                })}
              </div>
              <div className="w-full h-px mb-3 bg-slate-400 bg-center justify-center" />
            </div>
            <div className=" grid grid-flow-row gap-2 ">
              <span className="text-left font-bold text-lg hm:text-base">
                {t('period')}
              </span>
              <div className="flex gap-2 flex-wrap">
                {arrSeason.map((i) => {
                  return (
                    <React.Fragment key={i[0]}>
                      <ComboBox
                        type={season}
                        value={i[0]}
                        func={() => changeSeason(i[0])}
                        info={i[1]}
                      />
                    </React.Fragment>
                  )
                })}
                <div className="w-full h-px mb-3 bg-slate-400 bg-center justify-center" />
              </div>
            </div>
            <div className=" grid grid-flow-row gap-2 ">
              <span className="text-left font-bold text-lg hm:text-base">
                {t('days_week')}
              </span>
              <div className="flex gap-2 flex-wrap">
                {arrWeek.map((i) => {
                  return (
                    <React.Fragment key={i[0]}>
                      <ComboBox
                        type={week}
                        value={i[0]}
                        func={() => changeWeek(i[0])}
                        info={i[1]}
                      />
                    </React.Fragment>
                  )
                })}
                <div className="w-full h-px mb-3 bg-slate-400 bg-center justify-center" />
              </div>
            </div>
          </div>
          <div className="pb-6">{renderTimeBox()}</div>
        </div>
      </div>
    </>
  )
}

export default FullTime
