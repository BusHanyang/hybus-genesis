//import './App.css'

import React, { useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { Reset } from 'styled-reset'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { Card } from './app/components'
import { dark, fontSizes, fontWeights, light } from './app/components/theme'
import { useDarkMode } from './app/components/useDarkMode'

function App() {
  const [count, setCount] = useState(0)

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      // eslint-disable-next-line prefer-template
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error)
    },
  })

  const [themeMode, toggleTheme] = useDarkMode()
  const theme =
    themeMode === 'light'
      ? { mode: light, fontSizes, fontWeights }
      : { mode: dark, fontSizes, fontWeights }

  const [tab, setTab] = useState<string>('shuttlecoke_o')

  return (
    <>
      <ThemeProvider theme={theme}>
        <Reset />
        <Backgound>
          <div className="App">
            <header className="App-header">
              <h1 id="title">버스하냥</h1>
              <div id="notice" className="card">
                <p id="gong" className="text-red-500 font-extrabold">
                  공지
                </p>
                <p id="notice_text" className="float-left">
                  2022-여름학기 반영완료
                </p>
                <p id="notice_date" className="float-right">
                  06/19
                </p>
              </div>
            </header>
            <div id="time" className="card">
              <Card season="semester" week="week" location="shuttlecoke_o" expanded={false}/>
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
                className={`card btn ${tab === 'subway' ? 'active' : ''}`}
                onClick={() => setTab('subway')}
              >
                한대앞역
              </button>
              <button
                id="giksa"
                className={`card btn ${tab === 'giksa' ? 'active' : ''}`}
                onClick={() => setTab('giksa')}
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
                className={`card btn ${tab === 'yesulin' ? 'active' : ''}`}
                onClick={() => setTab('yesulin')}
              >
                예술인APT
              </button>
            </div>

            <button
              id="all"
              className="card btn w-full"
              onClick={() => (location.href = '#all')}
            >
              전체 시간표
            </button>

            <p className="copyright ">
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
    </>
  )
}

const Backgound = styled.div`
  background-color: ${({ theme }) => theme.mode.mainBackground};
  color: ${({ theme }) => theme.mode.primaryText};
`

export default App
