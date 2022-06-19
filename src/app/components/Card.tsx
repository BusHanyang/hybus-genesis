import axios, { AxiosResponse } from 'axios'
import moment from 'moment'
import React, { useEffect, useState } from 'react'

type SingleSchedule = {
  time: string
  type: string
}

async function api(url: string): Promise<Array<SingleSchedule>> {
  return await axios
    .get(url)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(response.statusText)
      }

      return response.data
    })
    .then((res) => res as Array<SingleSchedule>)
}

const getTimetable = async (
  season: string,
  week: string,
  location: string
): Promise<Array<SingleSchedule>> => {
  return await api(
    `https://proxy.anoldstory.workers.dev/https://timetable.hybus.app/${season}/${week}/${location}`
  )
    .then((res) => res.map((val) => val))
    .then((res) =>
      res.map((val) => {
        val['time'] = String(moment(val.time, 'hh:mm').unix())
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
  if (busType == 'DH') {
    return '한대앞행'
  } else if (busType == 'DY') {
    return '예술인행'
  } else if (busType == 'C') {
    return '순환노선'
  } else if (busType == 'R') {
    return '기숙사행'
  } else if (busType == 'NA') {
    return '운행안함'
  } else {
    return '셔틀콕행'
  }
}

export const Card = () => {
  const [timetable, setTimetable] = useState<Array<SingleSchedule>>([])
  const [currentTime, setCurrentTime] = useState<number>(new Date().getTime())

  useEffect(() => {
    if (timetable.length == 0) {
      getTimetable('semester', 'week', 'shuttlecoke_o').then((res) => {
        setTimetable(res)
      })
    }
  }, [timetable])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTime(new Date().getTime())
    }, 1000)

    return () => clearTimeout(timer)
  }, [timetable, currentTime])

  return (
    <div>
      {timetable
        .filter((val) => isAfterCurrentTime(val))
        .map((val, idx) =>
          idx < 5 ? (
            <>
              <span key={idx}>
                {val.type} :{' '}
                {secondToTimeFormat(
                  Math.floor(Number(val.time) - Number(currentTime) / 1000)
                )}
              </span>
              <br />
            </>
          ) : null
        )}
    </div>
  )
}
