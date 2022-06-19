import axios, { AxiosResponse } from 'axios'
import moment from 'moment'
import React, { ClassAttributes, useEffect, useState } from 'react'

type SingleSchedule = {
  time: string
  type: string
}

type ScheduleInfo = {
  season: string
  week: string
  location: string
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
  if (busType == 'C') {
    return '순환'
  } else if (busType == 'NA') {
    return '미운행'
  } else {
    return '직행'
  }
}

const getBusDestination = (busType: string, currentLoc: string): string => {
  if (currentLoc == 'shuttlecoke_o') {
    if (busType == 'C' || busType == 'DH') {
      return '한대앞역'
    } else if (busType == 'DY') {
      return '예술인 아파트'
    } else {
      return '???'
    }
  } else if (currentLoc == 'subway') {
    if (busType == 'C') {
      return '예술인 아파트'
    } else {
      return '셔틀콕 건너편'
    }
  } else if (currentLoc == 'yesulin') {
    return '셔틀콕 건너편'
  } else if (currentLoc == 'shuttlecoke_i') {
    if (busType == 'NA') {
      return '행선지 없음'
    } else if (busType == 'R') {
      return '기숙사'
    } else {
      return '???'
    }
  } else if (currentLoc == 'residence') {
    return '셔틀콕'
  }
}

const titleText = (location: string): string => {
  if (location == 'shuttlecoke_o') {
    return '셔틀콕'
  } else if (location == 'subway') {
    return '한대앞역 (4호선)'
  } else if (location == 'yesulin') {
    return '예술인 아파트'
  } else if (location == 'shuttlecoke_i') {
    return '셔틀콕 건너편 (기숙사행)'
  } else if (location == 'residence') {
    return '기숙사 (셔틀콕행)'
  } else {
    return '알수없음'
  }
}

const getColoredElement = (type: string) => {
  if (type == 'C') {
    return (
      <div className="bg-chip-red w-12 rounded-full inline-block">
        {busTypeToText(type)}
      </div>
    )
  } else {
    return (
      <div className="bg-chip-blue w-12 rounded-full inline-block">
        {busTypeToText(type)}
      </div>
    )
  }
}

export const Card = (props: ScheduleInfo) => {
  const [timetable, setTimetable] = useState<Array<SingleSchedule>>([])
  const [currentTime, setCurrentTime] = useState<number>(new Date().getTime())

  useEffect(() => {
    if (timetable.length == 0) {
      getTimetable(props.season, props.week, props.location).then((res) => {
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
    <div className="flex-auto items-center">
      <h2 className="font-bold">{titleText(props.location)}</h2>
      {timetable
        .filter((val) => isAfterCurrentTime(val))
        .map((val, idx) =>
          idx < 5 ? (
            <React.Fragment key={idx}>
              <div className="">
                {getColoredElement(val.type)}
                <span className="font-mono inline-block">
                  {secondToTimeFormat(
                    Math.floor(Number(val.time) - Number(currentTime) / 1000)
                  )}
                </span>
                <span>
                  {' 후 출발 ▶ ' + getBusDestination(val.type, props.location)}
                </span>
              </div>
            </React.Fragment>
          ) : (
            <></>
          )
        )}
    </div>
  )
}
