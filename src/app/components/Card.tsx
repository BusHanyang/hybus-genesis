import axios from 'axios'
import dayjs from 'dayjs'
import customParse from 'dayjs/plugin/customParseFormat'
import { t } from 'i18next'
import React, { CSSProperties, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SyncLoader } from 'react-spinners'

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

const getSettings = async (): Promise<null | Settings> => {
  return await axios
    .get('https://proxy.anoldstory.workers.dev/https://api.hybus.app/settings/')
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

    convertedHoliday.forEach((date) => {
      if (
        today.year() == date.year() &&
        today.month() == date.month() &&
        today.date() == date.date()
      ) {
        isHoliday = true
      }
    })

    convertedHaltDay.forEach((date) => {
      if (
        today.year() == date.year() &&
        today.month() == date.month() &&
        today.date() == date.date()
      ) {
        return ['halt', '']
      }
    })

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
    `https://proxy.anoldstory.workers.dev/https://api.hybus.app/timetable/${season}/${week}/${location}`
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
    if (busType == 'C' || busType == 'DH') {
      return t('dest_subway')
    } else if (busType == 'DY') {
      return t('dest_yesul')
    } else {
      return '???'
    }
  } else if (currentLoc == 'subway') {
    if (busType == 'C') {
      return t('dest_yesul')
    } else {
      return t('dest_shuttle_i')
    }
  } else if (currentLoc == 'yesulin') {
    return t('dest_shuttle_i')
  } else if (currentLoc == 'shuttlecoke_i') {
    if (busType == 'NA') {
      return t('no_dest')
    } else if (busType == 'R') {
      return t('dest_dorm')
    } else {
      return '???'
    }
  } else if (currentLoc == 'residence') {
    return t('dest_shuttle_o')
  } else {
    return '???'
  }
}

const titleText = (location: string): string => {
  if (location == 'shuttlecoke_o') {
    return t('shuttlecoke_o')
  } else if (location == 'subway') {
    return t('subway')
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
    return (
      <div className="bg-chip-red dark:text-black py-1 w-12 rounded-full inline-block text-center">
        {busTypeToText(type)}
      </div>
    )
  } else {
    return (
      <div className="bg-chip-blue dark:text-black py-1 w-12 rounded-full inline-block text-center">
        {busTypeToText(type)}
      </div>
    )
  }
}

export const Card = ({ location }: ScheduleInfo) => {
  const [timetable, setTimetable] = useState<Array<SingleSchedule>>([])
  const [currentTime, setCurrentTime] = useState<number>(new Date().getTime())
  const [isLoaded, setLoaded] = useState<boolean>(false)
  const [setting, setSetting] = useState<Settings | null>(null)

  useEffect(() => {
    if (!isLoaded) {
      getSettings()
        .then((s) => {
          setSetting(s)
          return s
        })
        .then((s) => {
          const [season, week] = getSeason(s)
          getTimetable(season, week, location).then((res) => {
            setTimetable(res)
            setLoaded(true)
          })
        })
    } else {
      setTimetable([])
      setLoaded(false)
      const [season, week] = getSeason(setting)
      getTimetable(season, week, location).then((res) => {
        setTimetable(res)
        setLoaded(true)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTime(new Date().getTime())
    }, 1000)

    return () => clearTimeout(timer)
  }, [timetable, currentTime])

  const loadingCSS: CSSProperties = {
    display: 'table-cell',
    verticalAlign: 'middle',
  }

  const renderTimetable = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { t } = useTranslation()

    if (isLoaded) {
      if (
        timetable.length === 0 ||
        (timetable.length === 1 && timetable[0] == null)
      ) {
        // Timetable load failure, or doesn't exist
        return (
          <>
            <div className="h-full table">
              <span className="table-cell align-middle">{t('no_today')}</span>
            </div>
          </>
        )
      }

      const filtered = timetable.filter((val) => isAfterCurrentTime(val))

      if (filtered.length === 0) {
        // Buses are done for today. User should refresh after midnight.
        return (
          <>
            <div className="h-full table">
              <span className="table-cell align-middle">{t('end_today')}</span>
            </div>
          </>
        )
      }

      // Otherwise - normal case
      return filtered.map((val, idx) => {
        if (idx < 5) {
          return (
            <React.Fragment key={idx}>
              <div className="text-left mx-auto w-82 py-1.5">
                {getColoredElement(val.type)}
                <span className="font-Ptd inline-block px-1 w-32 text-right">
                  {secondToTimeFormat(
                    Math.floor(Number(val.time) - Number(currentTime) / 1000)
                  )}{' '}
                  {t('left')}
                </span>
                <div className="text-center inline-block w-8 mx-2">▶</div>
                <span className="text-left inline-block">
                  {getBusDestination(val.type, location)}
                </span>
              </div>
            </React.Fragment>
          )
        }
      })
    }
  }

  return (
    <div className="h-full">
      <h2 className="font-bold text-2xl pb-2">{titleText(location)}</h2>
      <div className="inline-block select-none h-4/5">
        {!isLoaded ? (
          <div className="h-full table">
            <SyncLoader
              color="#AFBDCE"
              margin={4}
              size={8}
              loading={!isLoaded}
              cssOverride={loadingCSS}
            />
          </div>
        ) : (
          <></>
        )}
        {renderTimetable()}
      </div>
    </div>
  )
}
