import axios, { AxiosResponse } from 'axios'
import moment from 'moment'
import React, { CSSProperties, useEffect, useState } from 'react'
import { SyncLoader } from 'react-spinners'

type SingleSchedule = {
  time: string
  type: string
}

type ScheduleInfo = {
  season: string
  week: string
  location: string
  expanded: boolean
}

const api = async (url: string): Promise<Array<SingleSchedule>> => {
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
      // but not successfully.
      return new Array<SingleSchedule>(1)
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
  ).then((res) =>
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
  } else {
    return '???'
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

const getColoredElement = (type: string): JSX.Element => {
  if (type == 'C') {
    return (
      <div className="bg-chip-red w-12 rounded-full inline-block text-center">
        {busTypeToText(type)}
      </div>
    )
  } else {
    return (
      <div className="bg-chip-blue w-12 rounded-full inline-block text-center">
        {busTypeToText(type)}
      </div>
    )
  }
}

export const Card = (props: ScheduleInfo) => {
  const [timetable, setTimetable] = useState<Array<SingleSchedule>>([])
  const [currentTime, setCurrentTime] = useState<number>(new Date().getTime())
  const [expand, setExpand] = useState<boolean>(props.expanded)
  const [isLoaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    if (timetable.length == 0 && !isLoaded) {
      getTimetable(props.season, props.week, props.location).then((res) => {
        setTimetable(res)
        setLoaded(true)
      })
    }
  }, [isLoaded, props.location, props.season, props.week, timetable])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTime(new Date().getTime())
    }, 1000)

    return () => clearTimeout(timer)
  }, [timetable, currentTime])

  const toggleExpand = () => {
    setExpand(!expand)
  }

  const loadingCSS: CSSProperties = {
    display: 'table-cell',
    verticalAlign: 'middle',
  }

  const renderTimetable = () => {
    if (isLoaded) {
      if (
        timetable.length === 0 ||
        (timetable.length === 1 && timetable[0] == null)
      ) {
        // Timetable load failure, or doesn't exist
        return (
          <>
            <div className="h-24 table">
              <span className="table-cell align-middle">
                오늘 운행하는 셔틀이 존재하지 않습니다.
              </span>
            </div>
          </>
        )
      }

      const filtered = timetable.filter((val) => isAfterCurrentTime(val))

      if (filtered.length === 0) {
        return (
          <>
            <div className="h-24 table">
              <span className="table-cell align-middle">
                오늘 셔틀 운행이 종료되었습니다.
              </span>
            </div>
          </>
        )
      }

      return filtered.map((val, idx) => {
        if (idx < 5) {
          if (idx < 2) {
            return (
              <React.Fragment key={idx}>
                <div className="text-left mx-auto w-82 py-1.5">
                  {getColoredElement(val.type)}
                  <span className="font-mono inline-block px-1 w-40 text-right">
                    {secondToTimeFormat(
                      Math.floor(Number(val.time) - Number(currentTime) / 1000)
                    )}{' '}
                    후 출발
                  </span>
                  <div className="text-center inline-block w-8 mx-2">▶</div>
                  <span className="float-right text-left">
                    {getBusDestination(val.type, props.location)}
                  </span>
                </div>
              </React.Fragment>
            )
          } else {
            if (expand) {
              return (
                <React.Fragment key={idx}>
                  <div className="text-left mx-auto w-82 py-1.5">
                    {getColoredElement(val.type)}
                    <span className="font-mono inline-block px-1 w-40 text-right">
                      {secondToTimeFormat(
                        Math.floor(
                          Number(val.time) - Number(currentTime) / 1000
                        )
                      )}{' '}
                      후 출발
                    </span>
                    <div className="text-center inline-block w-8 mx-2">▶</div>
                    <span className="float-right text-left">
                      {getBusDestination(val.type, props.location)}
                    </span>
                  </div>
                </React.Fragment>
              )
            }
          }
        }
      })
    }
  }

  return (
    <div className="h-full" onClick={() => toggleExpand()}>
      <h2 className="font-bold text-2xl">{titleText(props.location)}</h2>
      <div className="inline-block select-none h-4/5">
        {!isLoaded ? (
          <div className="h-24 table">
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
