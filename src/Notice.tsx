import './Notice.css'

import React, { useEffect, useState } from 'react'

const Notice = () => {
  const url: string[] = [
    'https://huchu.link/yiBacVJ',
    'https://huchu.link/0XaPgDF',
  ]
  return (
    <a
      id="notice"
      className="card"
      onClick={() => {
        window.open(url[0])
      }}
    >
      <p id="gong">공지</p>
      <p id="notice_text">2022-여름학기 반영완료</p>
      <p id="notice_date">06/19</p>
    </a>
  )
}

export default Notice
