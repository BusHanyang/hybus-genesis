import axios, { AxiosResponse } from 'axios'
import React, { useEffect, useState } from 'react'

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

  let minute: TimeTables = { DH: [], DY: [], C: [], R: [], N: [], NA: [] }
  let hour = '00'

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
    getTimetable(season, week, location).then((res) => {
      setTimetable(res)
    })
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
    if (timetable.length === 0) {
      return <div> 조회 정보가 없습니다. </div>
    }

    const timetableFiltered: Map<string, Array<SingleSchedule>> = new Map()
    
    timetable.forEach((schedule) => {
      const spt = schedule.time.split(":")
      const hour = spt[0]
      
      if (timetableFiltered.has(hour)) {
        timetableFiltered.get(hour)!.push(schedule)
      }
      else {
        timetableFiltered.set(hour, [schedule])
      }
    })
  }

  return (
    <div className="App">
      <p>전체시간표</p>
      <div className=" h-full scroll-smooth	">
        <div className=" grid grid-flow-row gap-2 ">
          <p>버스 정류장</p>
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
          <div className="w-full h-px bg-slate-400 bg-center " />
        </div>
        <div className=" grid grid-flow-row gap-2 ">
          <p>시기</p>
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
          <div className="w-full h-px bg-slate-400 bg-center" />
        </div>

        <div className=" grid grid-flow-row gap-2 ">
          <p>요일</p>
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
          <div className="w-full h-px bg-slate-400 bg-center justify-center" />
        </div>
        <div className="grid grid-flow-row gap-4"></div>
      </div>
    </div>
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
        className={`items-center p-2 border-indigo-300 border rounded-2xl ${
          props.type === props.value ? 'bg-indigo-300' : ''
        }`}
        onClick={() => props.func(props.value)}
      >
        {props.info}
      </div>
    </>
  )
}

const TimeBox = (props: { hour: string; time: any; location: Location }) => {
  return (
    <>
      <div className=" bg-gray-200 rounded-xl drop-shadow-lg grid grid-cols-6 p-5">
        {/* {console.log(props.time)} */}
        <div className="... font-bold self-center">{props.hour}시</div>
        <div className="col-span-5">
          {props.time['C'].length != 0 ? (
            <Circle type="순환" minute={props.time['C']} />
          ) : null}{' '}
          {props.time['DH'].length +
            props.time['DY'].length +
            props.time['R'].length +
            props.time['N'].length !=
          0 ? (
            <Circle
              type="직행"
              minute={props.time['DH'].concat(
                props.time['DY'],
                props.time['N'],
                props.time['R']
              )}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}

const Circle = (props: { type: string; minute: any }) => {
  return (
    <div className="grid grid-cols-6">
      <div
        className={`... h-fit  dark:text-black py-1 w-12 rounded-full inline-block text-center ${
          props.type == '순환' ? 'bg-chip-red' : 'bg-chip-blue'
        }`}
      >
        {props.type}
      </div>
      <div className="col-span-5 text-left ml-3">
        {props.type == '순환' ? props.minute.join(' ') : props.minute.join(' ')}
      </div>
      {/* <div className="time dy">예술인){props.minute[1]}</div> */}
    </div>
  )
}

export default FullTime
