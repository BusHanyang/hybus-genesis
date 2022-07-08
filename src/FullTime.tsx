import './FullTime.css'

import axios, { AxiosResponse } from 'axios'
import React, { useEffect, useState } from 'react'

type SingleSchedule = {
  time: string
  type: string
}

type Location =
  | 'residence'
  | 'shuttlecoke_i'
  | 'shuttlecoke_o'
  | 'subway'
  | 'yesulin'

type Week = 'week' | 'weekend'
type Season = 'semester' | 'vacation_session' | 'vacation'

type Time = {
  hour: string
  DH?: Array<string>
  DY?: Array<string>
  C?: Array<string>
  N?: Array<string>
  R?: Array<string>
  NA?: Array<string>
}

const api = async (url: string): Promise<Array<SingleSchedule>> => {
  return await axios
    .get(url)
    .then((response) => {
      if (response.status !== 200) {
        console.log(`Error code: ${response.statusText}`)

        throw new Error(response.statusText)
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
  season: Season,
  week: Week,
  location: Location
): Promise<Array<SingleSchedule>> => {
  return await api(
    `https://proxy.anoldstory.workers.dev/https://timetable.hybus.app/${season}/${week}/${location}`
  ).then((res) => res.map((val) => val))
}

const FullTime = () => {
  const [timetable, setTimetable] = useState<Array<SingleSchedule>>([])
  const [season, setSeason] = useState<Season>('semester')
  const [week, setWeek] = useState<Week>('week')
  const [location, setLocation] = useState<Location>('shuttlecoke_o')

  let minute: any = { DH: [], DY: [], C: [], N: [], R: [], NA: [] }
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
  return (
    <div className="App">
      <div>
        <p>**버스 정류장</p>

        <div className="t-check-box">
          {arrLocation.map((i) => {
            return (
              <ComboBox
                key={i}
                type={location}
                value={i[0]}
                func={changeLocation}
                info={i[1]}
              />
            )
          })}
        </div>
      </div>
      <div className="horizon-line"></div>
      <div>
        <p>시기</p>
        <div className="t-check-box">
          {arrSeason.map((i) => {
            return (
              <ComboBox
                key={i}
                type={season}
                value={i[0]}
                func={changeSeason}
                info={i[1]}
              />
            )
          })}
        </div>
      </div>
      <div className="horizon-line"></div>
      <div>
        <p>요일</p>
        <div className="t-check-box">
          {arrWeek.map((i) => {
            return (
              <ComboBox
                key={i}
                type={week}
                value={i[0]}
                func={changeWeek}
                info={i[1]}
              />
            )
          })}
        </div>
      </div>
      <div className="horizon-line"></div>
      <div className="t-time-box">
        {timetable.length ? ( // timetable이 존재하는 경우
          timetable.map((i) => {
            // console.log(i)

            const preMinute = minute
            const preHour = hour

            if (i.time.split(':')[0] !== hour) {
              //   // 새로운 시간대가 나타나면
              //   if (location == 'shuttlecoke_o' || location == 'residence') {
              //     const time: Time = {
              //       hour: i.time.split(':')[0],
              //       C: [],
              //       DH: [],
              //       DY: [],
              //     }
              //   } else if (location == 'shuttlecoke_i') {
              //     const time: Time = {
              //       hour: i.time.split(':')[0],
              //       C: [],
              //       N: [],
              //     }
              //   } else {
              //     const time: Time = {
              //       hour: i.time.split(':')[0],
              //       R: [],
              //       NA: [],
              //     }

              //   }

              hour = i.time.split(':')[0]
              minute = { DH: [], DY: [], C: [], N: [], R: [], NA: [] }

              i.type !== ''
                ? minute[i.type].push(i.time.split(':')[1])
                : minute['N'].push(i.time.split(':')[1])
              if (preHour !== '00') {
                if (minute['NA'].length == 0) {
                  return (
                    // eslint-disable-next-line react/jsx-key
                    <TimeBox
                      hour={preHour}
                      time={preMinute}
                      location={location}
                    />
                  )
                }
              }
            } else {
              // 기존의 시간대
              i.type !== ''
                ? minute[i.type].push(i.time.split(':')[1])
                : minute['N'].push(i.time.split(':')[1])
            }
          })
        ) : (
          // timetable이 존재하자 않는 경우
          <div> 조회 정보가 없습니다. </div>
        )}
      </div>
    </div>
  )
}

const ComboBox = (props: {
  type: string
  value: Location | Season | Week
  func
  info: string
}) => {
  return (
    <div
      className={`check-box ${props.type === props.value ? 'check' : ''}`}
      onClick={() => props.func(props.value)}
    >
      {props.info}
    </div>
  )
}

const TimeBox = (props: { hour: string; time: any; location: Location }) => {
  return (
    <div>
      <div className="time-box">
        {/* {console.log(props.time)} */}
        <div className="hour">{props.hour}시</div>
        <div className="t_data">
          <div className="data">
            {props.time['C'].length != 0 ? (
              <Circle type="순환" minute={props.time['C']} />
            ) : null}
          </div>
          <div className="data">
            {props.time['DH'].length +
              props.time['DY'].length +
              props.time['R'].length +
              props.time['N'].length !=
            0 ? (
              <Circle
                type="직행"
                minute={[
                  props.time['DH'],
                  props.time['DY'],
                  props.time['N'],
                  props.time['R'],
                ]}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

const Circle = (props: { type: string; minute: any }) => {
  return (
    <div className="data">
      <div className={`type ${props.type == '순환' ? 'circle' : 'direct'}`}>
        {props.type}
      </div>
      <div className="time">
        {props.type == '순환' ? props.minute.join(' ') : props.minute.join(' ')}
      </div>
      {/* <div className="time dy">예술인){props.minute[1]}</div> */}
    </div>
  )
}

export default FullTime
