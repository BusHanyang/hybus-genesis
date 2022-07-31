//import './App.css'

import axios from 'axios'
import * as dayjs from 'dayjs'
import * as customParse from 'dayjs/plugin/customParseFormat'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { Reset } from 'styled-reset'

import { Card } from './app/components'
import { Fabs } from './app/components'
import { DevPage } from './app/components/devpage'
import Refreshing from './app/components/ptr/refreshing-content'
import { useDarkMode } from './app/components/useDarkMode'
import FullTime from './FullTime'
import Notice from './Notice'

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
        // 2XX Errors
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

const getSeason = async (): Promise<string> => {
  dayjs.extend(customParse)
  const today = dayjs()

  return await getSettings().then((setting) => {
    if (setting === null) {
      // Error fetching settings
      return ''
    } else {
      console.log(setting)
      const [semesterStart, semesterEnd] = [dayjs(setting.semester.start_date, 'YYYY-MM-DD'), dayjs(setting.semester.end_date, 'YYYY-MM-DD')]
      const [vacationSessionStart, vacationSessionEnd] = [dayjs(setting.vacation_session.start_date, 'YYYY-MM-DD'), dayjs(setting.vacation_session.end_date, 'YYYY-MM-DD')]
      const [vacationStart, vacationEnd] = [dayjs(setting.vacation.start_date, 'YYYY-MM-DD'), dayjs(setting.vacation.end_date, 'YYYY-MM-DD')]

      const todayUnix = today.unix()

      const convertedHoliday = setting.holiday.map((s) => dayjs(s, 'YYYY-MM-DD'))
      const convertedHaltDay = setting.halt.map((s) => dayjs(s, 'YYYY-MM-DD'))

      convertedHoliday.forEach((date) => {
        if (
          today.year() == date.year() &&
          today.month() == date.month() &&
          today.date() == date.date()
        ) {
          return 'holiday'
        }
      })

      convertedHaltDay.forEach((date) => {
        if (
          today.year() == date.year() &&
          today.month() == date.month() &&
          today.date() == date.date()
        ) {
          return 'halt'
        }
      })

      const dates = [
        semesterStart,
        semesterEnd,
        vacationSessionStart,
        vacationSessionEnd,
        vacationStart,
        vacationEnd,
      ]

      dates.forEach((date) => {
        date.hour(23)
        date.minute(59)
        date.second(59)
      })

      console.log(`semesterstart: ${semesterStart}`)

      if (semesterStart.unix() < todayUnix && todayUnix < semesterEnd.unix()) {
        // Semester
        return 'semester'
      } else if (
        vacationSessionStart.unix() < todayUnix &&
        todayUnix < vacationSessionEnd.unix()
      ) {
        // Vacation Session
        return 'vacation_session'
      } else if (
        vacationStart.unix() < todayUnix &&
        todayUnix < vacationEnd.unix()
      ) {
        // Vacation
        return 'vacation'
      } else {
        // Error!
        return 'error'
      }
    }
  })
}

const isWeekend = (): boolean => {
  return dayjs().day() == 0 || dayjs().day() == 6
}

function App() {
  //ptr내용 이전
  const colorDarkMod = '#27272a' //bg-zinc-800
  let dark = false
  let color = 'white'
  if (useDarkMode()[0] === 'dark') {
    dark = true
    color = colorDarkMod
  }

  const handleRefresh = (): Promise<React.FC> => {
    return new Promise(() => {
      location.reload()
    })
  }
  //끝

  const { t, i18n } = useTranslation()
  const changeToKo = () => i18n.changeLanguage('ko')
  const changeToEn = () => i18n.changeLanguage('en')

  const [table, changeFullTable] = useState<boolean>(false)

  const [themeMode, toggleTheme] = useDarkMode()

  const [tab, setTab] = useState<string>('')

  const saveClicked = (stn: string) => {
    window.localStorage.setItem('tab', stn)
    setTab(stn)
  }

  useEffect(() => {
    const aTab = window.localStorage.getItem('tab') || 'shuttlecoke_o'
    saveClicked(aTab)
  }, [tab])

  return (
    <>
      <Reset />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Fabs />
                <PullToRefresh
                  onRefresh={handleRefresh}
                  backgroundColor={color}
                  pullingContent=""
                  refreshingContent={<Refreshing mode={dark} />}
                >
                  <div className={`${themeMode === 'dark' ? 'dark' : ''}`}>
                    <div className="h-screen App">
                      <header className="App-header">
                        <h1 id="title" className="dark:text-white">
                          {t('title')}
                        </h1>
                        <Notice />
                      </header>

                      <div id="time" className="card bus">
                        <Card
                          season="semester"
                          week="week"
                          location={
                            window.localStorage.getItem('tab') ||
                            'shuttlecoke_o'
                          }
                        />
                      </div>

                      <div className="btn_group">
                        <button
                          id="shuttlecoke_o"
                          className={`card btn ${
                            tab === 'shuttlecoke_o' ? 'active' : ''
                          }`}
                          onClick={() => saveClicked('shuttlecoke_o')}
                        >
                          {t('shuttlecoke_o_btn')}
                        </button>
                        <button
                          id="subway"
                          className={`card btn ${
                            tab === 'subway' ? 'active' : ''
                          }`}
                          onClick={() => saveClicked('subway')}
                        >
                          {t('subway_btn')}
                        </button>
                        <button
                          id="residence"
                          className={`card btn ${
                            tab === 'residence' ? 'active' : ''
                          }`}
                          onClick={() => saveClicked('residence')}
                        >
                          {t('residence_btn')}
                        </button>
                      </div>

                      <div className="btn_group">
                        <button
                          id="shuttlecoke_i"
                          className={`card btn ${
                            tab === 'shuttlecoke_i' ? 'active' : ''
                          }`}
                          onClick={() => saveClicked('shuttlecoke_i')}
                        >
                          {t('shuttlecoke_i_btn')}
                        </button>

                        <button
                          id="yesulin"
                          className={`card btn ${
                            tab === 'yesulin' ? 'active' : ''
                          }`}
                          onClick={() => saveClicked('yesulin')}
                        >
                          {t('yesulin_btn')}
                        </button>
                      </div>

                      <Link to="/all">
                        <div id="all" className="card btn w-full">
                          {t('all_btn')}
                        </div>
                      </Link>
                      {/* <button
    id="all"
    className="card btn w-full"
    onClick={() => (location.href = '#all')}
  >
    전체 시간표
  </button> */}

                      <p id="copyright" className="dark:text-white">
                        Copyright © 2020-2022 BusHanyang. All rights reserved
                      </p>
                      {/* <p>
      <button type="button" onClick={() => toggleTheme()}>
        {themeMode === 'dark' ? '라이트모드' : '다크모드'}
      </button>
    </p> */}
                    </div>
                  </div>
                </PullToRefresh>
              </>
            }
          />
          <Route path="/all" element={<FullTime />}></Route>
          <Route path="/devpage" element={<DevPage />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
