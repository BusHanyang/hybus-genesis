import axios from 'axios'
import { t } from 'i18next'
import moment from 'moment'
import React, { CSSProperties, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SyncLoader } from 'react-spinners'

type SingleSchedule = {
  time: string
  type: string
}

type ScheduleInfo = {
  season: string
  week: string
  location: string
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
  return await api(
    `https://proxy.anoldstory.workers.dev/https://api.hybus.app/timetable/${season}/${week}/${location}`
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
    return t("cycle")
  } else if (busType == 'NA') {
    return t("NA")
  } else {
    return t("direct")
  }
}

const getBusDestination = (busType: string, currentLoc: string): string => {
  if (currentLoc == 'shuttlecoke_o') {
    if (busType == 'C' || busType == 'DH') {
      return t("dest_subway")
    } else if (busType == 'DY') {
      return t("dest_yesul")
    } else {
      return '???'
    }
  } else if (currentLoc == 'subway') {
    if (busType == 'C') {
      return t("dest_yesul")
    } else {
      return t("dest_shuttle_i")
    }
  } else if (currentLoc == 'yesulin') {
    return t("dest_shuttle_i")
  } else if (currentLoc == 'shuttlecoke_i') {
    if (busType == 'NA') {
      return t("no_dest")
    } else if (busType == 'R') {
      return t("dest_dorm")
    } else {
      return '???'
    }
  } else if (currentLoc == 'residence') {
    return t("dest_shuttle_o")
  } else {
    return '???'
  }
}

const titleText = (location: string): string => {
  if (location == 'shuttlecoke_o') {
    return t("shuttlecoke_o")
  } else if (location == 'subway') {
    return t("subway") 
  } else if (location == 'yesulin') {
    return t("yesulin")
  } else if (location == 'shuttlecoke_i') {
    return t("shuttlecoke_i")
  } else if (location == 'residence') {
    return t("residence")
  } else {
    return t("else")
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

export const Card = (props: ScheduleInfo) => {
  const [timetable, setTimetable] = useState<Array<SingleSchedule>>([])
  const [currentTime, setCurrentTime] = useState<number>(new Date().getTime())
  const [isLoaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    if (!isLoaded) {
      getTimetable(props.season, props.week, props.location).then((res) => {
        setTimetable(res)
        setLoaded(true)
      })
    } else {
      setTimetable([])
      setLoaded(false)
      getTimetable(props.season, props.week, props.location).then((res) => {
        setTimetable(res)
        setLoaded(true)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.location, props.season, props.week])

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
              <span className="table-cell align-middle">
                {t("no_today")}
              </span>
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
              <span className="table-cell align-middle">
                {t("end_today")}
              </span>
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
                  {t("left")}
                </span>
                <div className="text-center inline-block w-8 mx-2">▶</div>
                <span className="text-left inline-block">
                  {getBusDestination(val.type, props.location)}
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
      <h2 className="font-bold text-2xl pb-2">{titleText(props.location)}</h2>
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
