import 'react-tiny-fab/dist/styles.css'
import './fab.scss'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Action, Fab } from 'react-tiny-fab'

import Arrow from '/image/add_white_48dp.svg'
import DarkImg from '/image/dark_mode_black_48dp.svg'
import Email from '/image/email_black_48dp.svg'
import Info from '/image/infoblack.svg'
import LightImg from '/image/light_mode_black_48dp.svg'
import Support from '/image/local_cafe_black_48dp.svg'

import { Modal } from '../modal/modal'
import { useDarkMode } from '../useDarkMode'
export const Fabs = () => {
  const navigate = useNavigate()

  const [themeMode, toggleTheme] = useDarkMode()
  const [modalOpen, setModalOpen] = useState(false)
  const { t } = useTranslation()

  const openModal = () => {
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
  }

  let changeText = ''
  let changeColor = ''
  let iconColor = ''
  let dataTheme = ''
  let imgIcon = ''
  const handleEmailOnClick = (): Promise<React.FC> => {
    return new Promise(() => {
      window.location.href = 'mailto:admin@hybus.app'
    })
  }
  const handleDonateOnClick = (): Promise<React.FC> => {
    return new Promise(() => {
      window.location.href = 'https://www.buymeacoffee.com/hybus'
    })
  }
  // const handleDevOnClick = (): Promise<React.FC> => {
  //   return new Promise((res) => {
  //     navigate('/devpage');
  //   })
  // }
  const handleDarkOnClick = (): Promise<React.FC> => {
    return new Promise(() => {
      toggleTheme()
    })
  }
  if (useDarkMode()[0] === 'dark') {
    changeText = t('light')
    changeColor = '#374151'
    iconColor = 'white'
    dataTheme = 'dark'
    imgIcon = LightImg
  } else {
    changeText = t('dark')
    changeColor = '#ffffff'
    iconColor = 'black'
    dataTheme = 'white'
    imgIcon = DarkImg
  }
  return (
    <>
      <div className="font-Ptd">
        <Fab
          icon={
            <img
              className="iconImg w-12 h-12"
              src={Arrow}
              data-theme={dataTheme}
              alt="floating action button icon"
            />
          }
          mainButtonStyles={{ backgroundColor: '#7099C1', fontSize: '10px' }}
          style={{
            bottom: '1.5rem',
            right: '1.5rem',
            margin: '0px',
            padding: '0px',
          }}
          alwaysShowTitle={true}
        >
          <Action
            text={changeText}
            style={{ backgroundColor: changeColor, color: iconColor }}
            onClick={handleDarkOnClick}
          >
            <div className="icons">
              <img
                src={imgIcon}
                style={{ padding: 8 }}
                data-theme={dataTheme}
                alt="light and dark mode icon"
              />
            </div>
          </Action>
          <Action
            text={t('changelog')}
            style={{ backgroundColor: changeColor, color: iconColor }}
            onClick={openModal}
          >
            <div className="icons">
              <img
                src={Info}
                style={{ padding: 8 }}
                data-theme={dataTheme}
                alt="changelog icon"
              />
            </div>
          </Action>
          <Action
            text={t('donate')}
            style={{ backgroundColor: changeColor, color: iconColor }}
            onClick={handleDonateOnClick}
          >
            <div className="icons">
              <img
                src={Support}
                style={{ padding: 8 }}
                data-theme={dataTheme}
                alt="donate a cup of coffee icon"
              />
            </div>
          </Action>
          <Action
            text={t('ask')}
            style={{ backgroundColor: changeColor, color: iconColor }}
            onClick={handleEmailOnClick}
          >
            <div className="icons">
              <img
                src={Email}
                style={{ padding: 8 }}
                data-theme={dataTheme}
                alt="email icon"
              />
            </div>
          </Action>
        </Fab>
      </div>
      <React.Fragment>
        <Modal open={modalOpen} close={closeModal} header="Modal heading">
          <div
            className="font-Ptd"
            style={{ overflow: 'auto', maxHeight: '450px' }}
          >
            <div className="content-area">
              <div className="changelog">
                <div className="changelog-margin">
                  <h4>2022.08.12</h4>
                  <p>🎁 새롭게 런칭</p>
                </div>
                <div className="changelog-margin">
                  <h4>2021.08.07</h4>
                  <p>✏️ 상단 배너 학사공지 이미지 교체</p>
                </div>
                <div className="changelog-margin">
                  <h4>2021.04.05</h4>
                  <p>🔧 코로나19로 인한 시간표 변경사항 반영</p>
                </div>
                <div className="changelog-margin">
                  <h4>2020.12.09</h4>
                  <p>🎁 크리스마스 테마 적용</p>
                </div>
                <div className="changelog-margin">
                  <h4>2020.11.11</h4>
                  <p>🎁 다국어 부분 지원 (한국어, 영어)</p>
                </div>
                <div className="changelog-margin">
                  <h4>2020.09.17</h4>
                  <p>🔧 코로나19로 인한 시간표 변경사항 반영</p>
                </div>
                <div className="changelog-margin">
                  <h4>2020.08.26</h4>
                  <p>🔧 원격수업 전환으로 인한 시간표 변경사항 반영</p>
                </div>
                <div className="changelog-margin">
                  <h4>2020.06.15</h4>
                  <p>🔧 기말고사 기간 주중/주말 한대앞행 추가배차 반영</p>
                </div>
                <div className="changelog-margin">
                  <h4>2020.06.01</h4>
                  <p>🔧 대면수업 확대로 인한 시간표 변경사항 반영</p>
                  <p>✏️ 상단 배너 학사공지 이미지로 교체</p>
                </div>
                <div className="changelog-margin">
                  <h4>2020.04.22</h4>
                  <p>🔧 코로나19로 인한 한대앞행 노선 추가배차 반영</p>
                </div>
                <div className="changelog-margin">
                  <h4>2020.04.13</h4>
                  <p>🔧 코로나19로 인한 무기한 개강 연기 반영</p>
                </div>
                <div className="changelog-margin">
                  <h4>2020.03.09</h4>
                  <p>✏️ 사용안내 링크 추가, 변경사항 링크 추가</p>
                  <p>🎁 정식 배포</p>
                </div>

                <div className="changelog-margin">
                  <h4>2020.03.06</h4>
                  <p>✏️ 바닥글 삽입 - 사용안내, 변경사항</p>
                </div>

                <div className="changelog-margin">
                  <h4>2020.03.05</h4>
                  <p>🔧 코로나19 관련 개강연기 반영</p>
                </div>

                <div className="changelog-margin">
                  <h4>2020.02.18</h4>
                  <p>🔧 2020학년 1학기 학사일정 반영</p>
                </div>

                <div className="changelog-margin">
                  <h4>2020.02.02</h4>
                  <p>✏️ 배너 이미지 추가 - 신입생 환영</p>
                </div>

                <div className="changelog-margin">
                  <h4>2020.01.01</h4>
                  <p>🔧 배너 이미지 수정 - New Year</p>
                </div>

                <div className="changelog-margin">
                  <h4>2019.12.22</h4>
                  <p>🔧 국경일 및 휴업일 학사일정 반영</p>
                  <p>🔧 계절학기 기간 시간표 전환버그 수정</p>
                </div>

                <div className="changelog-margin">
                  <h4>2019.12.6</h4>
                  <p>🎁 베타 릴리즈</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </React.Fragment>
    </>
  )
}
