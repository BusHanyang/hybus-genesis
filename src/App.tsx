//import './App.css'

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
