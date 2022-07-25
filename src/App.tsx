//import './App.css'

import React, { useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Reset } from 'styled-reset'

import { Card } from './app/components'
import { useDarkMode } from './app/components/useDarkMode'
import FullTime from './FullTime'
import Notice from './Notice'

function App() {
  const [table, changeFullTable] = useState<boolean>(false)

  const [themeMode, toggleTheme] = useDarkMode()

  const [tab, setTab] = useState<string>('')

  const saveClicked = (stn: string) => {
    window.localStorage.setItem("tab", stn)
    setTab(stn)
  }

  useEffect(() => {
    const aTab = window.localStorage.getItem("tab") || "shuttlecoke_o"
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
                <div className={`${
                  themeMode === 'dark' ? 'dark' : ''
                }`}>
                  <div
                    className="h-screen App"
                  >
                    <header className="App-header">
                      <h1 id="title" className="dark:text-white">
                        버스하냥
                      </h1>
                      <Notice />
                    </header>

                    <div id="time" className="card bus">
                      <Card season="semester" week="week" location={window.localStorage.getItem("tab") || "shuttlecoke_o"} />
                    </div>

                    <div className="btn_group">
                      <button
                        id="shuttlecoke_o"
                        className={`card btn ${
                          tab === 'shuttlecoke_o' ? 'active' : ''
                        }`}
                        onClick={() => saveClicked('shuttlecoke_o')}
                      >
                        셔틀콕
                      </button>
                      <button
                        id="subway"
                        className={`card btn ${
                          tab === 'subway' ? 'active' : ''
                        }`}
                        onClick={() => saveClicked('subway')}
                      >
                        한대앞역
                      </button>
                      <button
                        id="residence"
                        className={`card btn ${
                          tab === 'residence' ? 'active' : ''
                        }`}
                        onClick={() => saveClicked('residence')}
                      >
                        기숙사
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
                        셔틀콕 건너편
                      </button>
                      
                      <button
                        id="yesulin"
                        className={`card btn ${
                          tab === 'yesulin' ? 'active' : ''
                        }`}
                        onClick={() => saveClicked('yesulin')}
                      >
                        예술인APT
                      </button>
                    </div>

                    <Link to="/all">
                      <div id="all" className="card btn w-full">
                        전체 시간표
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
                    <p>
                      <button type="button" onClick={() => toggleTheme()}>
                        {themeMode === 'dark' ? '라이트모드' : '다크모드'}
                      </button>
                    </p>
                  </div>
                </div>
            }
          />
          <Route path="/all" element={<FullTime />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App