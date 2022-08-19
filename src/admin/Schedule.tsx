import './Admin.css'

import React, { useEffect, useState } from 'react'

import RuleGenerator from './RuleGenerator'

type Iinput = {
  where: 'yesulin' | 'subway' /* subway or yesulin 기준역 */
  start: string /* String Seperated with : 시작 시간 */
  end: string /* String Seperated with :  끝나는 시간 */
  eachWhen: number /* Number 몇분마다 */
  isNonStop: 'Y' | 'N' /* "Y" or "N" 직항인가 */
}

type Idirect = 'C' | 'DH' | 'DY' | 'R'

type Irule = {
  time: string
  type: Idirect
}

type Ioutput = {
  giksa: Array<Irule>
  // eslint-disable-next-line camelcase
  shuttlecock_i: Array<Irule>
  // eslint-disable-next-line camelcase
  shuttlecock_o: Array<Irule>
  subway: Array<Irule>
  yesulin: Array<Irule>
}

function ObjectToString(json: Ioutput): string {
  return JSON.stringify(json).replaceAll(/\\/g, '')
}

function App() {
  const [input, setInput] = useState<Array<Iinput>>([
    /* 나중 오는 규칙이 우선 순위 */
    {
      where: 'yesulin' /* subway or yesulin 기준역 */,
      start: '08:00' /* String Seperated with : 시작 시간 */,
      end: '19:00' /* String Seperated with :  끝나는 시간 */,
      eachWhen: 5 /* Number 매시간 몇분마다 */,
      isNonStop: 'Y' /* "Y" or "N" 직항인가 */,
    },
    {
      where: 'subway' /* subway or yesulin 기준역 */,
      start: '08:00' /* String Seperated with : 시작 시간 */,
      end: '19:00' /* String Seperated with :  끝나는 시간 */,
      eachWhen: 5 /* Number 매시간 몇분마다 */,
      isNonStop: 'N' /* "Y" or "N" 직항인가 */,
    },
  ])

  const [output, setOutput] = useState<string>(
    ObjectToString({
      giksa: [],
      // eslint-disable-next-line camelcase
      shuttlecock_i: [],
      // eslint-disable-next-line camelcase
      shuttlecock_o: [],
      subway: [],
      yesulin: [],
    })
  )

  const handleOutputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOutput(e.currentTarget.value)
  }

  type ISchedule = {
    destination: 'subway' | 'yesulin'
    startHour: string
    startMinute: string
    endHour: string
    endMinute: string
    eachWhen: string
    isNonStop: 'Y' | 'N'
  }
  const [addScheduleTime, setAddScheduleTime] = useState<ISchedule>({
    destination: 'subway',
    startHour: '00',
    startMinute: '00',
    endHour: '00',
    endMinute: '00',
    isNonStop: 'Y',
    eachWhen: '30',
  })

  const [addRule, setAddRule] = useState<Iinput>({
    where: 'subway' /* subway or yesulin 기준역 */,
    start: '00:00' /* String Seperated with : 시작 시간 */,
    end: '06:30' /* String Seperated with :  끝나는 시간 */,
    eachWhen: 5 /* Number 매시간 몇분마다 */,
    isNonStop: 'N' /* "Y" or "N" 직항인가 */,
  })

  const addSchedule = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    const startTime = `${addScheduleTime.startHour}:${addScheduleTime.startMinute}`
    const endTime = `${addScheduleTime.endHour}:${addScheduleTime.endMinute}`
    const newInput = {
      where: addScheduleTime.destination /* subway or yesulin 기준역 */,
      start: startTime /* String Seperated with : 시작 시간 */,
      end: endTime /* String Seperated with :  끝나는 시간 */,
      eachWhen: Number(addScheduleTime.eachWhen) /* Number 매시간 몇분마다 */,
      isNonStop: addScheduleTime.isNonStop /* "Y" or "N" 직항인가 */,
    }
    if (startTime === endTime) {
      alert('시작시간과 끝나는 시간이 다르어야 합니다.')
    } else {
      if (
        input.filter(
          (i) =>
            i.where === newInput.where &&
            i.start === newInput.start &&
            i.end === newInput.end &&
            i.eachWhen === newInput.eachWhen &&
            i.isNonStop === newInput.isNonStop
        ).length === 0
      )
        setInput([...input, newInput])
    }
  }

  const deleteSchedule = (idx: number) => {
    setInput(input.filter((item, index) => index !== idx))
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAddScheduleTime({
      ...addScheduleTime,
      [e.target.id]: e.target.value,
    })
  }

  useEffect(() => {
    setOutput(ObjectToString(RuleGenerator.make(input)))
  }, [input])

  return (
    <div className="grid grid-cols-2 p-5 grid-rows-10 Admin">
      {/**
       * Select bar
       **/}
      <div className="col-span-2 text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        목적지 :
        <select
          id="destination"
          className="py-2.5 px-0 mx-1 text-sm text-gray-500 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-400 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer"
          defaultValue="subway"
          onChange={handleSelectChange}
        >
          <option value="subway">한대앞</option>
          <option value="yesulin">예술인</option>
        </select>
        시간:
        <select
          id="startHour"
          className="py-2.5 px-0 mx-1 text-sm text-gray-500 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-400 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer"
          defaultValue="00"
          onChange={handleSelectChange}
        >
          <option value="00">00</option>
          <option value="01">01</option>
          <option value="02">02</option>
          <option value="03">03</option>
          <option value="04">04</option>
          <option value="05">05</option>
          <option value="06">06</option>
          <option value="07">07</option>
          <option value="08">08</option>
          <option value="09">09</option>
          <option value="10">10</option>
          <option value="11">11</option>
          <option value="12">12</option>
          <option value="13">13</option>
          <option value="14">14</option>
          <option value="15">15</option>
          <option value="16">16</option>
          <option value="17">17</option>
          <option value="18">18</option>
          <option value="19">19</option>
          <option value="20">20</option>
          <option value="21">21</option>
          <option value="22">22</option>
          <option value="23">23</option>
        </select>
        :
        <select
          id="startMinute"
          className="py-2.5 px-0 mx-1 text-sm text-gray-500 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-400 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer"
          defaultValue="00"
          onChange={handleSelectChange}
        >
          <option value="00">00</option>
          <option value="05">05</option>
          <option value="10">10</option>
          <option value="15">15</option>
          <option value="20">20</option>
          <option value="25">25</option>
          <option value="30">30</option>
          <option value="35">35</option>
          <option value="40">40</option>
          <option value="45">45</option>
          <option value="50">50</option>
          <option value="55">55</option>
        </select>
        ~
        <select
          id="endHour"
          className="py-2.5 px-0 mx-1 text-sm text-gray-500 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-400 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer"
          defaultValue="00"
          onChange={handleSelectChange}
        >
          <option value="00">00</option>
          <option value="01">01</option>
          <option value="02">02</option>
          <option value="03">03</option>
          <option value="04">04</option>
          <option value="05">05</option>
          <option value="06">06</option>
          <option value="07">07</option>
          <option value="08">08</option>
          <option value="09">09</option>
          <option value="10">10</option>
          <option value="11">11</option>
          <option value="12">12</option>
          <option value="13">13</option>
          <option value="14">14</option>
          <option value="15">15</option>
          <option value="16">16</option>
          <option value="17">17</option>
          <option value="18">18</option>
          <option value="19">19</option>
          <option value="20">20</option>
          <option value="21">21</option>
          <option value="22">22</option>
          <option value="23">23</option>
          <option value="24">24</option>
        </select>
        :
        <select
          id="endMinute"
          className="py-2.5 px-0 mx-1 text-sm text-gray-500 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-400 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer"
          defaultValue="00"
          onChange={handleSelectChange}
        >
          <option value="00">00</option>
          <option value="05">05</option>
          <option value="10">10</option>
          <option value="15">15</option>
          <option value="20">20</option>
          <option value="25">25</option>
          <option value="30">30</option>
          <option value="35">35</option>
          <option value="40">40</option>
          <option value="45">45</option>
          <option value="50">50</option>
          <option value="55">55</option>
        </select>
        직행:
        <select
          id="isNonStop"
          className="py-2.5 px-0 mx-1 text-sm text-gray-500 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-400 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer"
          defaultValue="Y"
          onChange={handleSelectChange}
        >
          <option value="Y">Y</option>
          <option value="N">N</option>
        </select>
        시간 간격:
        <select
          id="eachWhen"
          className="py-2.5 px-0 mx-1 text-sm text-gray-500 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-400 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer"
          defaultValue="30"
          onChange={handleSelectChange}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="30">30</option>
        </select>
        분 간격으로
        <button
          type="submit"
          className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-blue-700 rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 hover:bg-blue-800"
          onClick={addSchedule}
        >
          추가하기
        </button>
      </div>

      {/**
       *  Admin-Input
       **/}
      <div className="p-1 row-span-9 Admin-input">
        <div className="w-full h-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          <button
            aria-current="true"
            type="button"
            className="w-full px-4 py-2 font-medium text-left text-white bg-blue-700 border-b border-gray-200 rounded-t-lg cursor-pointer focus:outline-none dark:bg-gray-800 dark:border-gray-600"
          >
            규칙 목록
          </button>
          {input.map((rule, idx) => (
            <React.Fragment key={idx}>
              <div className="w-full px-4 py-2 font-medium text-left border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white">
                <div>
                  목적지 : {rule.where} <br />
                  기간 : {rule.start}~{rule.end} <br />
                  {rule.eachWhen}분 간격으로 :{rule.isNonStop}
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-blue-700 rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 hover:bg-blue-800"
                  onClick={() => deleteSchedule(idx)}
                >
                  삭제하기
                </button>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      {/**
       *  Admin-Output
       **/}
      <div className="p-1 row-span-9 Admin-output">
        {/* {Object.keys(output).map((key) => {
          output[key].map((element, idx) => {
            return <div>{element}</div>
          })
        })} */}
        <div className="w-full h-full mb-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
            >
              긱사
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
            >
              셔틀
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-r-md hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
            >
              한대
            </button>
          </div>

          <div className="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
            <textarea
              id="comment"
              rows={25}
              className="w-full px-0 text-sm text-gray-900 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400"
              placeholder="Write a comment..."
              value={output}
              onChange={handleOutputChange}
              required
            ></textarea>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-t dark:border-gray-600">
            <button
              type="submit"
              className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-blue-700 rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 hover:bg-blue-800"
            >
              서버 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
