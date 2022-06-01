import React, { useState } from 'react'
import styled, { ThemeProvider } from "styled-components";
import { useDarkMode } from './app/components/useDarkMode';
import { light, dark, fontSizes, fontWeights } from './app/components/theme';
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Reset } from "styled-reset";
import './App.css'

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

  const [themeMode, toggleTheme] = useDarkMode();
  const theme =
    themeMode === "light" ? {mode: light, fontSizes, fontWeights} : {mode: dark, fontSizes, fontWeights}
  
  return (
    <>
      <ThemeProvider theme = {theme}>
        <Reset /> 
        <Backgound>
          <div className="App">
            <header className="App-header">
              <h1 id="title">버스하냥</h1> 
              <div id="notice" className="card">
                <p id="gong">공지</p>
                <p id="notice_text">집에 보내주세요.</p>
              </div>
              <div id="time" className="card" style={{height: '200px'}}>버스 정보</div>
              
              <div className="btn_group">
                <div id="shuttlecoke_o" className="card" onClick={() => location.href="#shuttlecoke_o"}>
                    <p id="btn_text">셔틀콕</p>
                  </div>
                  <div id="subway" className="card" onClick={() => location.href="#subway"}>
                    <p id="btn_text">한대앞</p>
                  </div>
                  <div id="giksa" className="card" onClick={() => location.href="#giksa"}>
                  <p id="btn_text">기숙사</p>
                  </div>
              </div>
              <div className="btn_group">
                <div id="shuttlecoke_i" className="card" onClick={() => location.href="#shuttlecoke_i"}>
                  <p id="btn_text">셔틀콕 건너편</p>
                </div>
                <div id="yesulin" className="card" onClick={() => location.href="#yesulin"}>
                  <p id="btn_text">예술인APT</p>
                </div>
              </div>
              
              <div id="all" className="card" onClick={() => location.href="#all"}>
                <p id="all_text">전체 시간표</p>
              </div>
              <p>
                <p className="copyright">
                  Copyright © 2020-2022 BusHanyang. All rights reserved
                </p>
              </p>
              <p>
                <button type="button" onClick={() => toggleTheme()}>
                  {themeMode === "dark" ? "라이트모드" : "다크모드"}
                </button>
              </p>
            </header>
          </div>
        </Backgound>
      </ThemeProvider>
    </>
  )
}

const Backgound = styled.div`
  background-color: ${({ theme }) => theme.mode.mainBackground};
  color: ${({ theme }) => theme.mode.primaryText};
`;


export default App

