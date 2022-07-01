import './Notice.css'

import React, { useEffect, useState } from 'react'

function Notice() {
  return (
    <div id="notice" className="card">
      <p id="gong">공지</p>
      <p id="notice_text">2022-여름학기 반영완료</p>
      <p id="notice_date">06/19</p>
    </div>
  )
}

export default Notice
