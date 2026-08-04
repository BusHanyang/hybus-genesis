import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import customParse from 'dayjs/plugin/customParseFormat'
import { useEffect, useMemo, useState } from 'react'

import {
  Season,
  Settings,
  SingleShuttleSchedule,
  StopLocation,
  Week,
} from '@/data'
import { seasonKeys } from '@/data/shuttle/season'
import { weekKeys } from '@/data/shuttle/week'
import { settingAPI, shuttleAPI } from '@/network'

dayjs.extend(customParse)

const isWeekend = (): boolean => {
  return dayjs().day() === 0 || dayjs().day() === 6
}

const getSeason = (setting: Settings): [Season, Week] => {
  const today = dayjs()
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
  const convertedHoliday = setting.holiday.map((date) =>
    dayjs(date, 'YYYY-MM-DD'),
  )
  const convertedHaltDay = setting.halt.map((date) => dayjs(date, 'YYYY-MM-DD'))
  const isHoliday = convertedHoliday.some(
    (holiday) =>
      today.year() === holiday.year() &&
      today.month() === holiday.month() &&
      today.date() === holiday.date(),
  )
  const isHaltDay = convertedHaltDay.some(
    (haltDay) =>
      today.year() === haltDay.year() &&
      today.month() === haltDay.month() &&
      today.date() === haltDay.date(),
  )

  if (isHaltDay) return [seasonKeys.HALT, weekKeys.UNKNOWN]

  const week = isWeekend() || isHoliday ? weekKeys.WEEKEND : weekKeys.WEEK

  if (semesterStart.unix() < todayUnix && todayUnix < semesterEnd.unix()) {
    return [seasonKeys.SEMESTER, week]
  }
  if (
    vacationSessionStart.unix() < todayUnix &&
    todayUnix < vacationSessionEnd.unix()
  ) {
    return [seasonKeys.VACATION_SESSION, week]
  }
  if (vacationStart.unix() < todayUnix && todayUnix < vacationEnd.unix()) {
    return [seasonKeys.VACATION, week]
  }
  return [seasonKeys.UNKNOWN, weekKeys.UNKNOWN]
}

const getTimetable = async (
  season: Season,
  week: Week,
  location: StopLocation,
): Promise<Array<SingleShuttleSchedule>> => {
  const timetable = await shuttleAPI(season, week, location)
  return timetable.map((schedule) => ({
    ...schedule,
    time: String(dayjs(schedule.time, 'HH:mm').unix()),
  }))
}

export const convertUnixToTime = (
  schedule: SingleShuttleSchedule,
): SingleShuttleSchedule => {
  return {
    ...schedule,
    time: dayjs.unix(Number(schedule.time)).format('HH:mm'),
  }
}

export const useShuttleTimetable = (location: StopLocation) => {
  const setting = useQuery({
    queryKey: ['settings'],
    queryFn: settingAPI,
    staleTime: 5 * 60 * 1000,
  })
  const [season, week]: [Season | null, Week | null] =
    setting.data === undefined ? [null, null] : getSeason(setting.data)
  const timetable = useQuery({
    queryKey: ['shuttle', season, week, location],
    queryFn: () => {
      if (
        season === null ||
        week === null ||
        season === seasonKeys.HALT ||
        week === weekKeys.UNKNOWN
      ) {
        return Array<SingleShuttleSchedule>()
      }
      return getTimetable(season, week, location)
    },
    staleTime: 30 * 1000,
    enabled: !!season && !!week && !!location,
  })
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const upcomingTimetable = useMemo(
    () =>
      timetable.data?.filter(
        (schedule) => Number(schedule.time) - currentTime / 1000 >= 0,
      ) ?? [],
    [currentTime, timetable.data],
  )
  const routeTimetable = useMemo(() => {
    const [first, second] = upcomingTimetable
    if (first === undefined) return []
    if (second?.time === first.time) return [first, second]
    return [first]
  }, [upcomingTimetable])

  return {
    currentTime,
    routeTimetable,
    season,
    timetable,
    upcomingTimetable,
    week,
  }
}
