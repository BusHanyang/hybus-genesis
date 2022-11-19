import axios from 'axios'
import dayjs from 'dayjs'
import customParse from 'dayjs/plugin/customParseFormat'
import { t } from 'i18next'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SyncLoader } from 'react-spinners'
import styled from 'styled-components'
import tw from 'twin.macro'

type SingleSchedule = {
  time: string
  type: string
}

type ScheduleInfo = {
  location: string
}

type Period = {
  start_date: string
  end_date: string
}

type Settings = {
  semester: Period
  vacation_session: Period
  vacation: Period
  holiday: Array<string>
  halt: Array<string>
}

dayjs.extend(customParse)

const TimetableWrapper = styled.div`
  ${tw`h-full`}
`

const HeadlineWrapper = styled.div`
  ${tw`relative`}
`

const Headline = styled.h2`
  ${tw`font-bold text-2xl mb-2 hsm:text-lg hsm:mb-4 hsm:mt-2 hm:text-[1.375rem] hm:mb-4 hm:mt-2`}
`

const MainTimetable = styled.div`
  ${tw`inline-block select-none h-4/5`}
`

const Chip = styled.div`
  ${tw`dark:text-black py-1 w-12 rounded-full inline-block text-center hsm:text-sm hsm:leading-4 hsm:w-10 hm:w-10 hm:text-[0.9rem]`}
`

const SingleTimetable = styled.div`
  ${tw`text-left mx-auto py-1.5`}
`

const TimeLeftWrapper = styled.span`
  ${tw`font-Ptd tabular-nums inline-block px-1 w-32 text-right hsm:text-sm hsm:w-[6.5rem] hm:text-[0.9rem] hm:w-[7rem] hm:px-0 hm:leading-6`}
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
  ${tw`table-cell align-middle`}
`

const getSettings = async (): Promise<null | Settings> => {
  return await axios
    .get('https://api.hybus.app/settings/')
    .then((response) => {
      if (response.status !== 200) {
        console.log(`Error code: ${response.statusText}`)
        return null
      }

      return response.data
    })
    .catch((err) => {
      if (err.response) {
        // 4XX Errors
        console.log('Error receiving data', err.data)
      } else if (err.request) {
        // No Response
        console.log('No Response Error', err.request)
      } else {
        // Somehow error occurred
        console.log('Error', err.message)
      }

      return null
    })
    .then((result) => {
      if (result === null) {
        return null
      }
      return result as Settings
    })
}

const isWeekend = (): boolean => {
  return dayjs().day() == 0 || dayjs().day() == 6
}

const getSeason = (setting: Settings | null): [string, string] => {
  const today = dayjs()

  if (setting === null) {
    // Error fetching settings
    return ['', '']
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
        return ['halt', '']
      }
    }

    if (semesterStart.unix() < todayUnix && todayUnix < semesterEnd.unix()) {
      // Semester
      if (isWeekend() || isHoliday) {
        return ['semester', 'weekend']
      } else {
        return ['semester', 'week']
      }
    } else if (
      vacationSessionStart.unix() < todayUnix &&
      todayUnix < vacationSessionEnd.unix()
    ) {
      // Vacation Session
      if (isWeekend() || isHoliday) {
        return ['vacation_session', 'weekend']
      } else {
        return ['vacation_session', 'week']
      }
    } else if (
      vacationStart.unix() < todayUnix &&
      todayUnix < vacationEnd.unix()
    ) {
      // Vacation
      if (isWeekend() || isHoliday) {
        return ['vacation', 'weekend']
      } else {
        return ['vacation', 'week']
      }
    } else {
      // Error!
      return ['error', '']
    }
  }
}

const timetableApi = async (url: string): Promise<Array<SingleSchedule>> => {
  return await axios
    .get(url)
    .then((response) => {
      if (response.status !== 200) {
        console.log(`Error code: ${response.statusText}`)
        return new Array<SingleSchedule>()
      }

      return response.data
    })
    .catch((err) => {
      if (err.response) {
        // 2XX Errors
        console.log('Error receiving data', err.data)
      } else if (err.request) {
        // No Response
        console.log('No Response Error', err.request)
      } else {
        // Somehow error occurred
        console.log('Error', err.message)
      }

      // Setting array length to 1 makes useEffect to identify that the api has fetched the timetable,
      // but not successfully. If the array length is 0, then due to useEffect the api will call twice.
      return new Array<SingleSchedule>(1)
    })
    .then((res) => res as Array<SingleSchedule>)
}

const getTimetable = async (
  season: string,
  week: string,
  location: string
): Promise<Array<SingleSchedule>> => {
  return await timetableApi(
    `https://api.hybus.app/timetable/${season}/${week}/${location}`
  ).then((res) =>
    res.map((val) => {
      val['time'] = String(dayjs(val.time, 'HH:mm').unix())
      return val
    })
  )
}

const isAfterCurrentTime = (sch: SingleSchedule): boolean => {
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
    return 'nmap://place?lat=37.30851&lng=126.85327&zoom=18&name=한대앞역 셔틀버스 정류장&appname=hybus.app'
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
    return 'https://map.naver.com/v5/?lng=126.85327&lat=37.30851&type=0&title=한대앞역 셔틀버스 정류장'
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
  const clicked = +new Date()
  location.href = getMapURLScheme(loc)
  setTimeout(function () {
    if (+new Date() - clicked < 2000 && !document.hidden) {
      window.location.href = getMapURL(loc)
    }
  }, 1500)
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
    return <Chip className="bg-chip-green">{busTypeToText(type)}</Chip>
  }

  return <Chip className="bg-chip-blue">{busTypeToText(type)}</Chip>
}

export const Card = ({ location }: ScheduleInfo) => {
  const [timetable, setTimetable] = useState<Array<SingleSchedule>>([])
  const [currentTime, setCurrentTime] = useState<number>(new Date().getTime())
  const [fetched, setFetched] = useState<boolean>(false)
  const [isLoaded, setLoaded] = useState<boolean>(false)
  const [spinning, setSpinning] = useState<boolean>(true)
  const [season, setSeason] = useState<string>('')
  const [week, setWeek] = useState<string>('')
  const [setting, setSetting] = useState<Settings | null>(null)
  const [currentLocation, setCurrentLocation] = useState<string>('init')

  // For fetching timetable setting json
  useEffect(() => {
    if (!fetched && setting == null) {
      getSettings().then((s) => {
        setSetting(s)
        setFetched(true)
      })
    }
  }, [fetched, setting])

  // For setting season & week values
  useEffect(() => {
    if (setting != null) {
      const [s, w] = getSeason(setting)
      setSeason(s)
      setWeek(w)
    }
  }, [setting])

  // For fetching the timetable for the initial time
  useEffect(() => {
    if (season !== '' && week !== '' && !isLoaded) {
      getTimetable(season, week, location).then((res) => {
        setTimetable(res)
        setSpinning(false)
        setLoaded(true)
        setCurrentLocation(location)
      })
    } else if (season === 'halt' && !isLoaded) {
      // If the season is halt, then the timetable will be empty.
      setSpinning(false)
      setLoaded(true)
    }
  }, [isLoaded, location, season, week])

  // For fetching the timetable when tab is changed (Efficient)
  useEffect(() => {
    if (
      season !== '' &&
      week !== '' &&
      isLoaded &&
      currentLocation !== 'init' &&
      location !== currentLocation
    ) {
      setSpinning(true)
      setTimetable([])
      getTimetable(season, week, location).then((res) => {
        setTimetable(res)
        setSpinning(false)
        setCurrentLocation(location)
        setCurrentTime(new Date().getTime())
      })
    } else if (
      season === 'halt' &&
      isLoaded &&
      currentLocation !== 'init' &&
      location !== currentLocation
    ) {
      setTimetable([])
      setCurrentLocation(location)
      setCurrentTime(new Date().getTime())
    }
  }, [currentLocation, isLoaded, location, season, week])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTime(new Date().getTime())
    }, 1000)

    return () => clearTimeout(timer)
  }, [timetable, currentTime])

  const RenderTimetable = (): JSX.Element => {
    const { t } = useTranslation()

    if (!spinning) {
      if (
        timetable.length === 0 ||
        (timetable.length === 1 && timetable[0] == null)
      ) {
        // Timetable load failure, or doesn't exist
        return (
          <>
            <NoTimetable>
              <NoTimetableInner>{t('no_today')}</NoTimetableInner>
            </NoTimetable>
          </>
        )
      }

      const filtered = timetable.filter((val) => isAfterCurrentTime(val))

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
                    <TimeLeftWrapper>
                      {secondToTimeFormat(
                        Math.floor(
                          Number(val.time) - Number(currentTime) / 1000
                        )
                      )}{' '}
                      {t('left')}
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
    } else {
      return <></>
    }
  }

  return (
    <TimetableWrapper>
      <HeadlineWrapper>
        <Headline>{titleText(location)}</Headline>
        <button
          className="absolute top-0 right-0 h-full"
          onClick={() => {
            openNaverMapApp(location)
          }}
        >
          <img
            src={'../image/map_black_24dp.svg'}
            className="cursor-default dark:invert h-full"
            alt="map icon"
          />
        </button>
      </HeadlineWrapper>
      <MainTimetable>
        {spinning ? (
          <NoTimetable>
            <SyncLoader
              color="#AFBDCE"
              margin={4}
              size={8}
              loading={spinning}
              cssOverride={tw`table-cell align-middle`}
            />
          </NoTimetable>
        ) : (
          <></>
        )}
        {RenderTimetable()}
      </MainTimetable>
    </TimetableWrapper>
  )
}
