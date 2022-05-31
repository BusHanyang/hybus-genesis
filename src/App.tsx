import './App.css'
import 'styled-components'

import React, { useState } from 'react'

import logo from './logo.svg'

function App() {
  const [table, changeFullTable] = useState<boolean>(false)

  return (
    <div className="App">
      <div>
        {' '}
        <img src={logo} className="App-logo" alt="logo" />
      </div>
      <button
        className="full-button"
        onClick={() => {
          changeFullTable(!table)
        }}
      >
        한대앞 전체시간표
      </button>
      {table === true ? <FullTime></FullTime> : null}
    </div>
  )
}

function FullTime() {
  return (
    <div>
      <div>
        <p>**버스 정류장</p>
      </div>
      <div className="horizon-line"></div>
      <div>
        <p>시기</p>
      </div>
      <div className="horizon-line"></div>

      <div>
        <p>요일</p>
      </div>
      <div className="horizon-line"></div>
      <div className="time-box">
        <div>8시</div>
        <div>
          <div className="circle">순환</div>
          <div></div>
          <div className="direct">직행</div>
        </div>
      </div>
      <div className="time-box">
        <p>9시</p>
        <div>순환</div>
      </div>
      <div className="time-box">
        <p>10시</p>
        <div>순환</div>
      </div>
    </div>
  )
}

export default App
