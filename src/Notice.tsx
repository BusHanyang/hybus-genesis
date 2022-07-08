import './Notice.css'

import React, { useEffect, useState } from 'react'

const Notice = () => {
  const url: string[] = [
    'https://huchu.link/yiBacVJ',
    'https://huchu.link/0XaPgDF',
  ]
  return (
    <div>
      <div
        id="carouselExampleSlidesOnly"
        className="carousel slide relative"
        data-bs-ride="carousel"
      >
        <div className="carousel-inner relative w-full overflow-hidden">
          <div className="carousel-item active relative float-left w-full">
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
          </div>
          <div className="carousel-item relative float-left w-full">
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
          </div>
        </div>
      </div>
      <script src="./TW-ELEMENTS-PATH/dist/js/index.min.js"></script>
    </div>
  )
}

export default Notice
