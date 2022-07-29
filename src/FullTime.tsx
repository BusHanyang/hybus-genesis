import axios, { AxiosResponse } from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useDarkMode } from './app/components/useDarkMode'

type SingleSchedule = {
  time: string
  type: string
}

interface TimeTables {
  DH: Array<string>
  DY: Array<string>
  C: Array<string>
  R: Array<string>
  N: Array<string>
  NA: Array<string>

  [prop: string]: Array<string>
}

type FilteredTimeTables = {
  time: string
  direct: Array<string>
  circle: Array<string>
  directY: Array<string>
}

type Location =
  | 'residence'
  | 'shuttlecoke_i'
  | 'shuttlecoke_o'
  | 'subway'
  | 'yesulin'

type Week = 'week' | 'weekend'
type Season = 'semester' | 'vacation_session' | 'vacation'

const api = async (url: string): Promise<Array<SingleSchedule>> => {
  return await axios
    .get(url)
    .then((response) => {
      if (response.status !== 200) {
        console.log(`Error code: ${response.statusText}`)

        throw new Error(response.statusText)
      }
      console.log(response.data)
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
  season: Season,
  week: Week,
  location: Location
): Promise<Array<SingleSchedule>> => {
  return await api(
    `https://proxy.anoldstory.workers.dev/https://api.hybus.app/timetable/${season}/${week}/${location}`
  )
}

const FullTime = () => {
  const [timetable, setTimetable] = useState<Array<SingleSchedule>>([])
  const [season, setSeason] = useState<Season>('semester')
  const [week, setWeek] = useState<Week>('week')
  const [location, setLocation] = useState<Location>('shuttlecoke_o')
  const [themeMode, toggleTheme] = useDarkMode()
  const navigate = useNavigate()

  // let minute: TimeTables = { DH: [], DY: [], C: [], R: [], N: [], NA: [] }
  // let hour = '00'

  const changeLocation = (value: Location) => {
    setLocation(value)
  }
  const changeSeason = (value: Season) => {
    setSeason(value)
  }
  const changeWeek = (value: Week) => {
    setWeek(value)
  }

  useEffect(() => {
    console.log(location)
    getTimetable(season, week, location)
      .then((res) => {
        setTimetable(res)
      })
      .then(() => renderTimebox())
  }, [location, season, week])

  const arrLocation: Array<[Location, string]> = [
    ['shuttlecoke_o', '셔틀콕'],
    ['subway', '한대앞역'],
    ['yesulin', '예술인 아파트'],
    ['residence', '기숙사'],
    ['shuttlecoke_i', '셔틀콕 건너편'],
  ]

  const arrSeason: Array<[Season, string]> = [
    ['semester', '학기중'],
    ['vacation', '방학'],
    ['vacation_session', '계절학기'],
  ]

  const arrWeek: Array<[Week, string]> = [
    ['week', '평일'],
    ['weekend', '주말'],
  ]

  const renderTimebox = () => {
    console.log('renderTimebox run')
    if (timetable.length === 0) {
      return <div> 조회 정보가 없습니다. </div>
    }

    const timetableFiltered: Map<string, Array<SingleSchedule>> = new Map()
    // Key: 시간, Value: 일정 [{"time": "HH:MM", "type": "DH"}]

    timetable.forEach((schedule) => {
      const spt = schedule.time.split(':')
      const hour = spt[0]

      if (timetableFiltered.has(hour)) {
        timetableFiltered.get(hour)?.push(schedule)
      } else {
        timetableFiltered.set(hour, [schedule])
      }
    })

    const filterdByType: Array<FilteredTimeTables> = []

    console.log(filterdByType)
    console.log('renderTimebox exit')
    timetableFiltered.forEach((schedules, hour) => {
      const single: FilteredTimeTables = {
        time: hour,
        direct: [],
        circle: [],
        directY: [],
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
        }
      })
      filterdByType.push(single)
      console.log(filterdByType)

      return <></>
      // [{ time: '08', direct: ["08:00", "08:10", ...], circle: [], directY: ["08:20", "08:50"] }, { time: '09', direct: [], circle: [], directY: [] }, ...]
    })

    return (
      <div className="App">
        <div className=" h-full scroll-smooth	">
          <div className=" grid grid-flow-row gap-2 ">
            <span className="text-left font-bold text-lg">버스 정류장</span>
            <div className="flex gap-2 ">
              {arrLocation.map((i) => {
                return (
                  <React.Fragment key={i[0]}>
                    <ComboBox
                      type={location}
                      value={i[0]}
                      func={changeLocation}
                      info={i[1]}
                    />{' '}
                  </React.Fragment>
                )
              })}
            </div>
            <div className="w-full h-px mb-3 bg-slate-400 bg-center justify-center" />
          </div>
          <div className=" grid grid-flow-row gap-2 ">
            <span className="text-left font-bold text-lg">시기</span>
            <div className="flex gap-2 ">
              {arrSeason.map((i) => {
                return (
                  <React.Fragment key={i[0]}>
                    <ComboBox
                      type={season}
                      value={i[0]}
                      func={changeSeason}
                      info={i[1]}
                    />{' '}
                  </React.Fragment>
                )
              })}
            </div>{' '}
            <div className="w-full h-px mb-3 bg-slate-400 bg-center justify-center" />
          </div>
          <div className=" grid grid-flow-row gap-2 ">
            <span className="text-left font-bold text-lg">요일</span>
            <div className="flex gap-2 ">
              {arrWeek.map((i) => {
                return (
                  <React.Fragment key={i[0]}>
                    <ComboBox
                      type={week}
                      value={i[0]}
                      func={changeWeek}
                      info={i[1]}
                    />{' '}
                  </React.Fragment>
                )
              })}
            </div>{' '}
            <div className="w-full h-px mb-3 bg-slate-400 bg-center justify-center" />
          </div>{' '}
          <div className="grid grid-flow-row gap-4">
            {filterdByType.map((schedule) => {
              return (
                <React.Fragment key={schedule.time}>
                  <TimeBox
                    time={schedule.time}
                    direct={schedule.direct}
                    directY={schedule.directY}
                    circle={schedule.circle}
                  />
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  return (
    <>
      <div className={`${themeMode === 'dark' ? 'dark' : ''}`}>
        <div className="px-5 flex self-center py-5 dark:invert">
          <img
            src="../public/image/leftArrow.png"
            alt="back page"
            width={30}
            height={20}
          />
          <span className="text-left font-bold text-xl"> 전체시간표</span>
        </div>
        <div>{renderTimebox()}</div>
      </div>
    </>
  )
}

const ComboBox = (props: {
  type: string
  value: Location | Season | Week
  func: any
  info: string
}) => {
  return (
    <>
      <div
        className={`font-medium items-center p-2 border-[#DBE2F9] dark:border-[#3F4759] border rounded-2xl ${
          props.type === props.value ? 'bg-[#DBE2F9] dark:bg-[#3F4759]' : ''
        }`}
        onClick={() => props.func(props.value)}
      >
        {props.info}
      </div>
    </>
  )
}

const TimeBox = (props: FilteredTimeTables) => {
  return (
    <>
      <div className=" bg-[#E1E2EC] dark:bg-[#44464E] rounded-xl drop-shadow-lg grid grid-cols-6 p-5">
        <div className="font-bold self-center">{props.time}시</div>
        <div className="font-medium  inline-grid grid-flow-row col-span-5 ">
          <div
            className={`inline-grid grid-cols-5 ${
              props.circle.length === 0 ? 'hidden' : 'block'
            }`}
          >
            <div className="self-center bg-chip-red h-fit  dark:text-black py-1 w-12 rounded-full inline-block text-center">
              순환
            </div>
            <div className="self-center text-left ml-3 col-span-4">
              {props.circle.join(' ')}
            </div>
          </div>
          <div
            className={`inline-grid grid-cols-5 ${
              props.direct.length === 0 ? 'hidden' : 'block'
            }`}
          >
            <div className="self-center bg-chip-blue h-fit  dark:text-black py-1 w-12 rounded-full inline-block text-center">
              직행
            </div>
            <div className="self-center text-left ml-3 col-span-4">
              {props.direct.map((i) => {
                return (
                  <React.Fragment key={i}>
                    <span>{i} </span>{' '}
                  </React.Fragment>
                )
              })}
              <span
                className={`inline-block ${
                  props.directY.length === 0 ? 'hidden' : 'text-green-500'
                }`}
              >
                {props.directY.join(' ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default FullTime
