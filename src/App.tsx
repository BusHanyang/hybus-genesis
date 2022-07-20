//import './App.css'

import React, { useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import styled, { ThemeProvider } from 'styled-components'
import { Reset } from 'styled-reset'

import { Card } from './app/components'
import { dark, fontSizes, fontWeights, light } from './app/components/theme'
import { useDarkMode } from './app/components/useDarkMode'
import FullTime from './FullTime'
import FullTime2 from './FullTime2'
import Notice from './Notice'
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
                <Backgound className={`${themeMode === 'dark' ? 'dark' : ''}`}>
                  <div className={`App ${themeMode === 'dark' ? 'dark' : ''}`}>
                    <header className="App-header">
                      <h1 id="title" className="dark:text-white">
                        버스하냥
                      </h1>
                      <Notice />
                    </header>

                    <div id="time" className="card bus">
                      <Card season="semester" week="week" location={tab} />
                    </div>

                    <div className="btn_group">
                      <button
                        id="shuttlecoke_o"
                        className={`card btn ${
                          tab === 'shuttlecoke_o' ? 'active' : ''
                        }`}
                        onClick={() => setTab('shuttlecoke_o')}
                      >
                        셔틀콕
                      </button>
                      <button
                        id="subway"
                        className={`card btn ${
                          tab === 'subway' ? 'active' : ''
                        }`}
                        onClick={() => setTab('subway')}
                      >
                        한대앞역
                      </button>
                      <button
                        id="residence"
                        className={`card btn ${
                          tab === 'residence' ? 'active' : ''
                        }`}
                        onClick={() => setTab('residence')}
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
                        onClick={() => setTab('shuttlecoke_i')}
                      >
                        셔틀콕 건너편
                      </button>
                      <button
                        id="yesulin"
                        className={`card btn ${
                          tab === 'yesulin' ? 'active' : ''
                        }`}
                        onClick={() => setTab('yesulin')}
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
                </Backgound>
              </ThemeProvider>
            }
          />
          <Route path="/all" element={<FullTime />}></Route>
          <Route path="/all2" element={<FullTime2 />}></Route>
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
