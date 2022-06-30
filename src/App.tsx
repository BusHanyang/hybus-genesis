import './App.css'

import React, { useState } from 'react'
import { Link, Route, BrowserRouter, Routes } from 'react-router-dom'
import styled, { ThemeProvider } from 'styled-components'
import { Reset } from 'styled-reset'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { dark, fontSizes, fontWeights, light } from './app/components/theme'
import { useDarkMode } from './app/components/useDarkMode'
import FullTime from './FullTime'

function App() {
  const [table, changeFullTable] = useState<boolean>(false)

  const [themeMode, toggleTheme] = useDarkMode()
  const theme =
    themeMode === 'light'
      ? { mode: light, fontSizes, fontWeights }
      : { mode: dark, fontSizes, fontWeights }

  const [tab, setTab] = useState<string>('shuttlecoke_o')

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ThemeProvider theme={theme}>
                <Reset />
                <Backgound>
                  <div className="App">
                    <div className="App-header">
                      <h1 id="title">버스하냥</h1>
                      <div id="notice" className="card">
                        <p id="gong">공지</p>
                        <p id="notice_text">2022-여름학기 반영완료</p>
                        <p id="notice_date">06/19</p>
                      </div>
                      <div
                        id="time"
                        className="card"
                        style={{ height: '200px' }}
                      >
                        버스 정보
                      </div>

                      <div className="btn_group">
                        <div
                          id="shuttlecoke_o"
                          className={`card ${
                            tab === 'shuttlecoke_o' ? 'active' : ''
                          }`}
                          onClick={() => setTab('shuttlecoke_o')}
                        >
                          <p id="btn_text">셔틀콕</p>
                        </div>
                        <div
                          id="subway"
                          className={`card ${tab === 'subway' ? 'active' : ''}`}
                          onClick={() => setTab('subway')}
                        >
                          <p id="btn_text">한대앞</p>
                        </div>
                        <div
                          id="giksa"
                          className={`card ${tab === 'giksa' ? 'active' : ''}`}
                          onClick={() => setTab('giksa')}
                        >
                          <p id="btn_text">기숙사</p>
                        </div>
                      </div>
                      <div className="btn_group">
                        <div
                          id="shuttlecoke_i"
                          className={`card ${
                            tab === 'shuttlecoke_i' ? 'active' : ''
                          }`}
                          onClick={() => setTab('shuttlecoke_i')}
                        >
                          <p id="btn_text">셔틀콕 건너편</p>
                        </div>
                        <div
                          id="yesulin"
                          className={`card ${
                            tab === 'yesulin' ? 'active' : ''
                          }`}
                          onClick={() => setTab('yesulin')}
                        >
                          <p id="btn_text">예술인APT</p>
                        </div>
                      </div>
                      <Link id="all" className="card" to="/all">
                        전체 시간표
                      </Link>
                      {/* <div
                        id="all"
                        className="card"
                        onClick={() => (location.href = '#all')}
                      >
                        <p id="all_text">전체 시간표</p>
                      </div> */}
                      <p>
                        <p className="copyright">
                          Copyright © 2020-2022 BusHanyang. All rights reserved
                        </p>
                      </p>
                      <p>
                        <button type="button" onClick={() => toggleTheme()}>
                          {themeMode === 'dark' ? '라이트모드' : '다크모드'}
                        </button>

                        {table === true ? <FullTime></FullTime> : null}
                      </p>
                    </div>
                  </div>
                </Backgound>
              </ThemeProvider>
            }
          />
          <Route path="/all" element={<FullTime />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

const Backgound = styled.div`
  background-color: ${({ theme }) => theme.mode.mainBackground};
  color: ${({ theme }) => theme.mode.primaryText};
`

export default App
