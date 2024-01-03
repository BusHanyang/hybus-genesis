import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import customParse from 'dayjs/plugin/customParseFormat'
import { t } from 'i18next'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SyncLoader } from 'react-spinners'
import styled from 'styled-components'
import tw from 'twin.macro'

import {
  Season,
  Settings,
  ShuttleStop,
  SingleShuttleSchedule,
  StopLocation,
  Week,
} from '@/data'
import { seasonKeys } from '@/data/shuttle/season'
import { weekKeys } from '@/data/shuttle/week'
import { settingAPI, shuttleAPI } from '@/network'

dayjs.extend(customParse)

const TimetableWrapper = styled.div`
  ${tw`h-[14.8rem]`}
`

const HeadlineWrapper = styled.div`
  ${tw`relative`} drag-save-n
`

const Headline = styled.h2`
  ${tw`font-bold text-2xl mb-2 hsm:text-lg hsm:mb-4 hsm:mt-2 hm:text-[1.375rem] hm:mb-4 hm:mt-2`}
`

const MainTimeTableWrapper = styled.div`
  ${tw`w-full h-[11.25rem] inline-block touch-none`}
`

const MainTimetable = styled.div`
  ${tw`inline-block select-none h-full`}
`

const Chip = styled.div`
  ${tw`dark:text-black py-1 w-12 rounded-full inline-block text-center hsm:text-sm hsm:leading-4 hsm:w-10 hm:w-10 hm:text-[0.9rem]`}
`

const SingleTimetable = styled.div`
  ${tw`text-left mx-auto py-1.5`}
`

const OnTouchAvailableWrapper = styled.div`
  ${tw`bg-slate-200 dark:bg-slate-500 rounded-md text-center h-8 w-[17.5rem] hm:w-[16.25rem] hsm:w-[14.85rem] mx-auto p-1.5 leading-5`}
`

const TimeLeftWrapper = styled.span`
  ${tw`font-Ptd tabular-nums inline-block px-1 w-32 text-right hsm:text-sm hsm:w-[6.5rem] hm:text-[0.9rem] hm:w-[7rem] hm:px-0 hm:leading-6`}
  &.touched {
    ${tw`font-bold text-[#ff673d] dark:text-[#ff996a]`}
  }
`

const ArrowWrapper = styled.div`
  ${tw`text-center inline-block w-6 mx-1.5 hsm:w-4 hsm:text-sm hsm:mx-[0.040rem] hm:mx-0.5 hm:text-[0.9rem] hm:w-6 hm:leading-6`}
`

const DestinationWrapper = styled.span`
  ${tw`text-left inline-block hsm:text-sm hm:text-[0.9rem] hm:leading-6`}
`

const NoTimetable = styled.div`
  ${tw`h-full table`}
`

const NoTimetableInner = styled.span`
  ${tw`table-cell align-middle leading-6`}
`

const TimeClickableConversionText = styled.span`
  ${tw`transition duration-300`}
`

const TimeClickableNotifyText = styled.div`
  ${tw`transition-transform float-left my-auto hsm:text-[0.8rem] hm:text-[0.875rem]`}
`

const ApiStatusButton = styled.button`
  ${tw`rounded-md bg-gray-200 text-gray-700 cursor-default px-2 py-1 mt-2`}
`

const isWeekend = (): boolean => {
  return dayjs().day() == 0 || dayjs().day() == 6
}

const getSeason = (setting: Settings | null): [Season, Week] => {
  const today = dayjs()

  if (setting === null) {
    // Error fetching settings
    return [seasonKeys.UNKNOWN, weekKeys.UNKNOWN]
  } else {
    const [semesterStart, semesterEnd] = [
      dayjs(setting.semester.start_date, 'YYYY-MM-DD'),
      dayjs(setting.semester.end_date, 'YYYY-MM-DD')
        .set('hour', 23)
        .set('minute', 59)
        .set('second', 59),
    ]
    const [vacationSessionStart, vacationSessionEnd] = [
      dayjs(setting.vacation_session.start_date, 'YYYY-MM-DD'),
      dayjs(setting.vacation_session.end_date, 'YYYY-MM-DD')
        .set('hour', 23)
        .set('minute', 59)
        .set('second', 59),
    ]
    const [vacationStart, vacationEnd] = [
      dayjs(setting.vacation.start_date, 'YYYY-MM-DD'),
      dayjs(setting.vacation.end_date, 'YYYY-MM-DD')
        .set('hour', 23)
        .set('minute', 59)
        .set('second', 59),
    ]

    const todayUnix = today.unix()

    const convertedHoliday = setting.holiday.map((s) => dayjs(s, 'YYYY-MM-DD'))
    const convertedHaltDay = setting.halt.map((s) => dayjs(s, 'YYYY-MM-DD'))

    let isHoliday = false

    for (const holiday of convertedHoliday) {
      if (
        today.year() == holiday.year() &&
        today.month() == holiday.month() &&
        today.date() == holiday.date()
      ) {
        isHoliday = true
        break
      }
    }

    for (const haltDay of convertedHaltDay) {
      if (
        today.year() == haltDay.year() &&
        today.month() == haltDay.month() &&
        today.date() == haltDay.date()
      ) {
        return [seasonKeys.HALT, weekKeys.UNKNOWN]
      }
    }

    if (semesterStart.unix() < todayUnix && todayUnix < semesterEnd.unix()) {
      // Semester
      if (isWeekend() || isHoliday) {
        return [seasonKeys.SEMESTER, weekKeys.WEEKEND]
      } else {
        return [seasonKeys.SEMESTER, weekKeys.WEEK]
      }
    } else if (
      vacationSessionStart.unix() < todayUnix &&
      todayUnix < vacationSessionEnd.unix()
    ) {
      // Vacation Session
      if (isWeekend() || isHoliday) {
        return [seasonKeys.VACATION_SESSION, weekKeys.WEEKEND]
      } else {
        return [seasonKeys.VACATION_SESSION, weekKeys.WEEK]
      }
    } else if (
      vacationStart.unix() < todayUnix &&
      todayUnix < vacationEnd.unix()
    ) {
      // Vacation
      if (isWeekend() || isHoliday) {
        return [seasonKeys.VACATION, weekKeys.WEEKEND]
      } else {
        return [seasonKeys.VACATION, weekKeys.WEEK]
      }
    } else {
      // Error!
      return [seasonKeys.UNKNOWN, weekKeys.UNKNOWN]
    }
  }
}

const getTimetable = async (
  season: Season,
  week: Week,
  location: StopLocation
): Promise<Array<SingleShuttleSchedule>> => {
  return await shuttleAPI(season, week, location).then((res) => {
    if (res !== null) {
      res.map((data) => {
        data['time'] = String(dayjs(data.time, 'HH:mm').unix())
        return data
      })
    }
    return res
  })
}

const convertUnixToTime = (
  sch: SingleShuttleSchedule
): SingleShuttleSchedule => {
  return {
    ...sch,
    time: dayjs.unix(Number(sch.time)).format('HH:mm'),
  }
}

const isAfterCurrentTime = (sch: SingleShuttleSchedule): boolean => {
  const timestamp = new Date().getTime() / 1000
  return Number(sch.time) - timestamp >= 0
}

const secondToTimeFormat = (n: number): string => {
  const seconds = n % 60
  let minutes = Math.floor(n / 60)
  const hours = Math.floor(minutes / 60)

  if (minutes >= 60) {
    minutes = minutes % 60
  }

  let formattedMin = `${minutes}`
  let formattedSec = `${seconds}`
  let formattedHour = `${hours}`

  if (hours < 10) {
    formattedHour = `0${hours}`
  }

  if (minutes < 10) {
    formattedMin = `0${minutes}`
  }

  if (seconds < 10) {
    formattedSec = `0${seconds}`
  }

  if (hours === 0) {
    return `${formattedMin}:${formattedSec}`
  } else {
    return `${formattedHour}:${formattedMin}:${formattedSec}`
  }
}

const busTypeToText = (busType: string): string => {
  if (busType == 'C') {
    return t('cycle')
  } else if (busType == 'NA') {
    return t('NA')
  } else {
    return t('direct')
  }
}

const getBusDestination = (busType: string, currentLoc: string): string => {
  if (currentLoc == 'shuttlecoke_o') {
    if (busType == 'C' || busType == 'DH' || busType == 'DHJ') {
      return t('dest_subway')
    } else if (busType == 'DY') {
      return t('dest_yesul')
    } else {
      return t('loading')
    }
  } else if (currentLoc == 'subway') {
    if (busType == 'C') {
      return t('dest_yesul')
    } else if (busType == 'DHJ') {
      return t('dest_jungang')
    } else {
      return t('dest_shuttle_i')
    }
  } else if (currentLoc == 'yesulin') {
    return t('dest_shuttle_i')
  } else if (currentLoc == 'jungang') {
    return t('dest_shuttle_i')
  } else if (currentLoc == 'shuttlecoke_i') {
    if (busType == 'NA') {
      return t('no_dest')
    } else if (busType == 'R') {
      return t('dest_dorm')
    } else {
      return t('loading')
    }
  } else if (currentLoc == 'residence') {
    return t('dest_shuttle_o')
  } else {
    return t('loading')
  }
}

const getMapURLScheme = (loc: string): string => {
  if (loc == 'shuttlecoke_o') {
    return 'nmap://place?lat=37.2987258&lng=126.8379922&zoom=18&name=셔틀콕&appname=hybus.app'
  } else if (loc == 'subway') {
    return 'nmap://place?lat=37.309738&lng=126.852051&zoom=18&name=한대앞역 셔틀버스 정류장&appname=hybus.app'
  } else if (loc == 'yesulin') {
    return 'nmap://place?lat=37.31951&lng=126.84564&zoom=18&name=예술인 셔틀버스 정류장&appname=hybus.app'
  } else if (loc == 'jungang') {
    return 'nmap://place?lat=37.31489&lng=126.83961&zoom=18&name=중앙역 셔틀버스 정류장&appname=hybus.app'
  } else if (loc == 'shuttlecoke_i') {
    return 'nmap://place?lat=37.29923&lng=126.83737&zoom=18&name=셔틀콕 건너편 정류장&appname=hybus.app'
  } else if (loc == 'residence') {
    return 'nmap://place?lat=37.29349&lng=126.83644&zoom=18&name=기숙사 셔틀버스 정류장&appname=hybus.app'
  } else {
    return 'nmap://place?lat=37.2987258&lng=126.8379922&zoom=18&name=셔틀콕&appname=hybus.app'
  }
}

const getMapURL = (loc: string): string => {
  if (loc == 'shuttlecoke_o') {
    return 'https://map.naver.com/v5/?lng=126.8379922&lat=37.2987258&type=0&title=셔틀콕'
  } else if (loc == 'subway') {
    return 'https://map.naver.com/v5/?lng=126.852051&lat=37.309738&type=0&title=한대앞역 셔틀버스 정류장'
  } else if (loc == 'yesulin') {
    return 'https://map.naver.com/v5/?lng=126.84564&lat=37.31951&type=0&title=예술인 셔틀버스 정류장'
  } else if (loc == 'jungang') {
    return 'https://map.naver.com/v5/?lng=126.83961&lat=37.31489&type=0&title=중앙역 셔틀버스 정류장'
  } else if (loc == 'shuttlecoke_i') {
    return 'https://map.naver.com/v5/?lng=126.83737&lat=37.29923&type=0&title=셔틀콕 건너편 정류장'
  } else if (loc == 'residence') {
    return 'https://map.naver.com/v5/?lng=126.83644&lat=37.29349&type=0&title=기숙사 셔틀버스 정류장'
  } else {
    return 'https://map.naver.com'
  }
}

const openNaverMapApp = (loc: string): void => {
  // Check if web client is Safari
  if (
    navigator.userAgent.match(/(iPod|iPhone|iPad|Macintosh)/) &&
    navigator.userAgent.match(/AppleWebKit/) &&
    !navigator.userAgent.match(/Chrome/)
  ) {
    const naverMap = confirm(t('use_naver_map'))

    if (naverMap) {
      window.location.href = getMapURLScheme(loc)
    } else {
      window.location.href = getMapURL(loc)
    }
  } else {
    const clicked = +new Date()
    location.href = getMapURLScheme(loc)
    setTimeout(function () {
      if (+new Date() - clicked < 1500 && !document.hidden) {
        window.location.href = getMapURL(loc)
      }
    }, 1000)
  }
}

const titleText = (location: string): string => {
  if (location == 'shuttlecoke_o') {
    return t('shuttlecoke_o')
  } else if (location == 'subway') {
    return t('subway')
  } else if (location == 'jungang') {
    return t('jungang')
  } else if (location == 'yesulin') {
    return t('yesulin')
  } else if (location == 'shuttlecoke_i') {
    return t('shuttlecoke_i')
  } else if (location == 'residence') {
    return t('residence')
  } else {
    return t('else')
  }
}

const getColoredElement = (type: string): JSX.Element => {
  if (type == 'C') {
    return <Chip className="bg-chip-red">{busTypeToText(type)}</Chip>
  } else if (type == 'DHJ') {
    return <Chip className="bg-chip-purple">{busTypeToText(type)}</Chip>
  } else if (type == 'DY') {
    return <Chip className="bg-chip-green">{busTypeToText(type)}</Chip>
  }

  return <Chip className="bg-chip-blue">{busTypeToText(type)}</Chip>
}

export const Card = ({ location }: ShuttleStop) => {
  const setting = useQuery({
    queryKey: ['settings'],
    queryFn: settingAPI,
  })
  const [season, week] =
    setting.data !== undefined ? getSeason(setting.data) : [null, null]

  const timetable = useQuery({
    queryKey: ['shuttle', season, week, location],
    queryFn: () => {
      if (season === null || week === null) {
        return Array<SingleShuttleSchedule>()
      }
      return getTimetable(season, week, location)
    },
    enabled: !!season && !!week && !!location,
  })
  const [currentTime, setCurrentTime] = useState<number>(new Date().getTime())
  const [touched, setTouched] = useState<boolean>(false)
  const [infoClosed, setInfoClosed] = useState<boolean>(
    window.localStorage.getItem('touch_info') === 'closed'
  )
  const [timetableAlive, setTimetableAlive] = useState<boolean>(true)

  // Recalculate & Rerender every second
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTime(new Date().getTime())
    }, 1000)

    return () => clearTimeout(timer)
  }, [timetable.data, currentTime])

  // For info card to not show when error or no shuttle available
  useEffect(() => {
    const filtered = timetable.data?.filter((val) => isAfterCurrentTime(val))
    if (
      timetable.data?.length === 0 ||
      timetable.status !== 'success' ||
      filtered?.length === 0
    ) {
      setTimetableAlive(false)
    } else {
      setTimetableAlive(true)
    }
  }, [timetable.data, timetable.status])

  // Set week and season to localStorage
  useEffect(() => {
    if (season !== null) {
      window.localStorage.setItem('season', season)
    }

    if (week !== null) {
      window.localStorage.setItem('week', week)
    }
  }, [season, week])

  const handleActionStart = (
    e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
  ) => {
    setTouched(true)
  }

  const handleActionEnd = (
    e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
  ) => {
    setTouched(false)
  }

  const handleContextMenu = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    e.preventDefault()
  }

  const openApiMonitor = () => {
    window.open(
      'https://monitor.hybus.app/status/bushanyang',
      '_black',
      'noopener noreferrer'
    )
  }

  const RenderTimetable = (showActualTime: boolean): JSX.Element => {
    const { t } = useTranslation()

    if (timetable.data === undefined) {
      return <></>
    }

    if (timetable.isPending) {
      return <></>
    }

    if (timetable.status === 'error') {
      // Timetable API error
      return (
        <>
          <NoTimetable>
            <NoTimetableInner>
              {t('api_error')}
              <br />
              <ApiStatusButton onClick={openApiMonitor}>
                {t('status_check')}
              </ApiStatusButton>
            </NoTimetableInner>
          </NoTimetable>
        </>
      )
    }

    if (timetable.data.length === 0) {
      // Timetable doesn't exist
      return (
        <>
          <NoTimetable>
            <NoTimetableInner>{t('no_today')}</NoTimetableInner>
          </NoTimetable>
        </>
      )
    }

    const filtered = timetable.data.filter((val) => isAfterCurrentTime(val))
    const reverted = filtered.map((val) => convertUnixToTime(val))

    if (filtered.length === 0) {
      // Buses are done for today. User should refresh after midnight.
      return (
        <>
          <NoTimetable>
            <NoTimetableInner>{t('end_today')}</NoTimetableInner>
          </NoTimetable>
        </>
      )
    }

    // Otherwise - normal case
    return (
      <>
        {filtered.map((val, idx) => {
          if (idx < 5) {
            return (
              <React.Fragment key={idx}>
                <SingleTimetable>
                  {getColoredElement(val.type)}
                  <TimeLeftWrapper
                    className={`${showActualTime ? 'touched' : ''}`}
                  >
                    {showActualTime ? (
                      <TimeClickableConversionText>
                        {reverted[idx].time.split(':')[0] +
                          t('hour') +
                          reverted[idx].time.split(':')[1] +
                          t('minute') +
                          ' ' +
                          t('departure')}
                      </TimeClickableConversionText>
                    ) : (
                      <TimeClickableConversionText>
                        {secondToTimeFormat(
                          Math.floor(
                            Number(val.time) - Number(currentTime) / 1000
                          )
                        ) +
                          ' ' +
                          t('left')}
                      </TimeClickableConversionText>
                    )}
                  </TimeLeftWrapper>
                  <ArrowWrapper>▶</ArrowWrapper>
                  <DestinationWrapper>
                    {getBusDestination(val.type, location)}
                  </DestinationWrapper>
                </SingleTimetable>
              </React.Fragment>
            )
          } else {
            return <React.Fragment key={idx} />
          }
        })}
      </>
    )
  }

  return (
    <TimetableWrapper>
      <HeadlineWrapper>
        <Headline>{titleText(location)}</Headline>
        <button
          className="absolute top-0 right-0 h-full drag-save-n"
          onClick={() => {
            openNaverMapApp(location)
          }}
        >
          <img
            src={'../image/map_black_24dp.svg'}
            className="cursor-default dark:invert h-8 w-8 hsm:h-7 hsm:w-7 drag-save-n"
            alt="map icon"
            onContextMenu={handleContextMenu}
            draggable="false"
          />
        </button>
      </HeadlineWrapper>
      <MainTimeTableWrapper
        onTouchStart={handleActionStart}
        onTouchEnd={handleActionEnd}
        onMouseDown={handleActionStart}
        onMouseUp={handleActionEnd}
      >
        <MainTimetable>
          {timetable.isPending ? (
            <NoTimetable>
              <SyncLoader
                color="#AFBDCE"
                margin={4}
                size={8}
                loading={timetable.isPending}
                cssOverride={tw`table-cell align-middle`}
              />
            </NoTimetable>
          ) : (
            <></>
          )}
          {RenderTimetable(touched)}
        </MainTimetable>
      </MainTimeTableWrapper>
      <OnTouchAvailableWrapper
        className={
          timetable.isPending || infoClosed || !timetableAlive ? 'hidden' : ''
        }
      >
        {touched ? (
          <TimeClickableNotifyText>
            <>{t('now_actual_time')}</>
          </TimeClickableNotifyText>
        ) : (
          <TimeClickableNotifyText>
            <>{t('check_on_touch')}</>
          </TimeClickableNotifyText>
        )}
        <div className="w-[fit-content] float-right ml-1 h-full flex hsm:ml-0">
          <img
            src={'../image/close_black_24dp.svg'}
            className="cursor-default dark:invert h-4 w-4 my-auto"
            alt="close icon"
            onClick={() => {
              setInfoClosed(true)
              window.localStorage.setItem('touch_info', 'closed')
              window.location.reload()
            }}
          />
        </div>
      </OnTouchAvailableWrapper>
    </TimetableWrapper>
  )
}
