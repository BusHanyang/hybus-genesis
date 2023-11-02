import React, { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import PullToRefresh from 'react-simple-pull-to-refresh'
import styled from 'styled-components'
import { Reset } from 'styled-reset'
import tw from 'twin.macro'

import { Card, Fabs } from './app/components'
import Notice from './app/components/Notice'
import Refreshing from './app/components/ptr/refreshing-content'
import { Realtime } from './app/components/Realtime'
import { THEME, useDarkmodeContext } from './app/context/ThemeContext'

const FullTime = lazy(() => import('./app/components/FullTime'))
const ModalOpen = lazy(() => import('./app/components/modal/modalOpen'))

const Apps = styled.div`
  ${tw`
    h-full pl-5 pr-5 bg-white text-black font-Ptd text-center mx-auto select-none max-w-7xl relative
    dark:bg-zinc-800 dark:text-white
  `}
`

const Circle = styled.span`
  ${tw`
    flex rounded-full inline-block
    h-3 w-3 rt1:h-2.5 rt1:w-2.5
  `}
`
const RouteText = styled.div`
  ${tw`
    inline-block rt1:text-sm rt2:text-xs hsm:mx-1
  `}
`

const CardView = styled.div`
  ${tw`
    mb-3 justify-center items-center font-medium 
    bg-white rounded-lg shadow-[0_2.8px_8px_rgba(10,10,10,0.2)]
    dark:bg-gray-700 dark:border-gray-700 dark:text-white dark:shadow-[0_2.8px_8px_rgba(10,10,10,0.8)]
  `}
`

const Button = styled(CardView)`
  ${tw`
    flex will-change-transform overflow-hidden cursor-default 
    border-none px-2 py-6 hm:py-4 hm:text-sm hm:leading-4 dark:text-white
  `}
  &.active {
    ${tw`
      bg-blue-300 dark:text-black drop-shadow-none shadow-inner transition-all ease-out duration-700
    `}
  }

  &#shuttlecoke_i {
    ${tw`shuttlei:flex-col shuttlei:gap-x-0 gap-x-1 items-center justify-center`}
  }
`
const SegmentedControl = styled.div`
  ${tw`
    p-1 w-[16rem] hsm:w-[14rem] text-sm hsm:text-xs items-center grid grid-cols-2 gap-2 rounded-xl bg-gray-200 dark:bg-gray-800  
  `}
`

const RadioLabel = styled.label`
  ${tw`
    block cursor-default select-none rounded-xl p-1 text-center peer-checked:bg-blue-400 peer-checked:font-bold peer-checked:text-white
    transition-colors ease-in-out duration-150
  `}
`

const BetaText = styled.span`
  ${tw`mx-1 italic font-light`}
`

const DARK_MODE_COLOR = '#27272a' //bg-zinc-800

function App() {
  const [modalTarget, setModalTarget] = useState<string>('')
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalAni, setModalAni] = useState<boolean>(false)
  const [, setTriggered] = useState<boolean>(false)
  const [touchPrompt, setTouchPrompt] = useState<boolean>(
    window.localStorage.getItem('touch_info') === null
  )

  const handleContextMenu = (e: { preventDefault: () => void }) => {
    e.preventDefault()
  }

  const openModal = () => {
    setModalOpen(true)
  }

  const handleModalTarget = () => {
    openModal()
    setModalTarget('Info')
  }

  const closeModal = () => {
    setModalAni(true)
    setTimeout(() => {
      setModalAni(false)
      setModalOpen(false)
    }, 300)
  }

  const handleRefresh = (): Promise<React.FC> => {
    return new Promise(() => {
      location.reload()
    })
  }

  const { t, i18n } = useTranslation()

  const { theme } = useDarkmodeContext()
  const [tab, setTab] = useState<string>('')
  const [realtimeMode, setRealtimeMode] = useState<boolean>()
  const isDarkMode = theme === THEME.DARK

  const saveClicked = (stn: string) => {
    window.localStorage.setItem('tab', stn)
    setTab(stn)
  }

  const realtimeClicked = (isOk: string) => {
    window.localStorage.setItem('realtimeMode', isOk)
    setRealtimeMode(isOk === 'sub')
  }

  const getCardHeight = (): string => {
    if (!touchPrompt) {
      if (tab === 'subway' || tab === 'jungang') {
        // No prompt at Stations
        return 'h-[19.6rem]'
      } else {
        // default (No prompt)
        return 'h-[17rem]'
      }
    } else {
      if (tab === 'subway' || tab === 'jungang') {
        if (!realtimeMode) {
          // Shuttle Bus Info at Stations with prompt
          return 'h-[21rem] hsm:h-[20.7rem]'
        } else {
          // Subway info at Stations with prompt
          return 'h-[19.6rem]'
        }
      } else {
        // default with prompt
        return 'h-[18rem]'
      }
    }
  }

  useEffect(() => {
    const savedLanguage =
      window.localStorage.getItem('language') || i18n.language
    window.localStorage.removeItem('lang')
    if (savedLanguage === 'ko') {
      i18n.changeLanguage('ko')
    } else {
      i18n.changeLanguage('en')
    }
    window.localStorage.setItem('language', i18n.language)
  }, [i18n])

  useEffect(() => {
    const aTab = window.localStorage.getItem('tab') || 'shuttlecoke_o'
    saveClicked(aTab)
  }, [tab])

  useEffect(() => {
    const savedMode = window.localStorage.getItem('realtimeMode') || 'bus'
    realtimeClicked(savedMode)
  }, [realtimeMode])

  useEffect(() => {
    document.body.classList.add('h-full')
    document.documentElement.classList.add('h-full')
    document.documentElement.classList.add('h-dfull')
  }, [])

  useEffect(() => {
    const status = window.localStorage.getItem('touch_info') === null
    setTouchPrompt(status)
  }, [])

  return (
    <>
      <Reset />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Fabs openModal={openModal} mTarget={setModalTarget} />
                <PullToRefresh
                  onRefresh={handleRefresh}
                  backgroundColor={isDarkMode ? DARK_MODE_COLOR : 'white'}
                  pullingContent=""
                  refreshingContent={
                    <Refreshing mode={isDarkMode ? THEME.DARK : THEME.LIGHT} />
                  }
                  resistance={3}
                >
                  <div
                    className={`${isDarkMode ? 'dark' : ''} h-full`}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <Apps>
                      <header className="App-header">
                        <div className="relative">
                          <h1
                            id="title"
                            className="font-bold p-3 text-3xl hm:text-[1.625rem] static pt-6 pb-3"
                          >
                            {t('title')}
                            <img
                              src="/image/helpblack.svg"
                              alt="information icon"
                              onClick={handleModalTarget}
                              className="bottom-3 right-0 absolute h-9 w-9 dark:invert hsm:h-8 hsm:w-8 drag-save-n cursor-default"
                              onContextMenu={handleContextMenu}
                              draggable="false"
                            ></img>
                          </h1>
                        </div>
                        <CardView className="p-3 h-[3rem] w-full">
                          <Notice />
                        </CardView>
                      </header>

                      <CardView
                        className={`p-6 hm:p-4 transition-[height] delay-75 ${getCardHeight()}`}
                      >
                        {realtimeMode &&
                        (tab === 'subway' || tab === 'jungang') ? (
                          <>
                            <Realtime
                              station={`
                                ${(tab === 'subway' ? '한대앞' : '중앙').trim()}
                              `}
                            />
                          </>
                        ) : (
                          <>
                            <Card
                              location={
                                window.localStorage.getItem('tab') ||
                                'shuttlecoke_o'
                              }
                            />
                          </>
                        )}
                        <div
                          className={`flex justify-center transition-[opacity,margin] delay-75 opacity-0 pointer-events-none
                            ${
                              !realtimeMode && touchPrompt
                                ? 'mt-6 hm:mt-[1.85rem] hsm:mt-7'
                                : ''
                            }
                            ${
                              tab === 'subway' || tab === 'jungang'
                                ? 'opacity-100 pointer-events-auto'
                                : ''
                            } 
                          `}
                        >
                          <SegmentedControl>
                            <div>
                              <input
                                type="radio"
                                name="option"
                                id="1"
                                value="1"
                                className="peer hidden"
                                onChange={() => realtimeClicked('bus')}
                                checked={!realtimeMode}
                              />
                              <RadioLabel htmlFor="1">
                                {t('shuttle')}
                              </RadioLabel>
                            </div>
                            <div>
                              <input
                                type="radio"
                                name="option"
                                id="2"
                                value="2"
                                className="peer hidden"
                                onChange={() => realtimeClicked('sub')}
                                checked={realtimeMode}
                              />
                              <RadioLabel htmlFor="2">
                                {t('subw')}
                                <BetaText>(Beta)</BetaText>
                              </RadioLabel>
                            </div>
                          </SegmentedControl>
                        </div>
                      </CardView>

                      <CardView className="p-4 h-12 hm:p-2 flex">
                        <div>
                          <Circle className="bg-chip-red mr-2 hsm:mx-2" />
                          <RouteText>{t('cycle_index')}</RouteText>
                        </div>
                        <div>
                          <Circle className="bg-chip-blue mx-2" />
                          <RouteText>{t('direct_index')}</RouteText>
                        </div>
                        <div>
                          <Circle className="bg-chip-green mx-2" />
                          <RouteText>{t('yesulin_index')}</RouteText>
                        </div>
                        <div>
                          <Circle className="bg-chip-purple mx-2" />
                          <RouteText>{t('jungang_index')}</RouteText>
                        </div>
                      </CardView>
                      <div className="grid grid-cols-3 gap-4">
                        <Button
                          id="shuttlecoke_o"
                          className={`${
                            tab === 'shuttlecoke_o' ? 'active' : ''
                          }`}
                          onClick={() => saveClicked('shuttlecoke_o')}
                        >
                          {t('shuttlecoke_o_btn')}
                        </Button>
                        <Button
                          id="subway"
                          className={`${tab === 'subway' ? 'active' : ''}`}
                          onClick={() => saveClicked('subway')}
                        >
                          {t('subway_btn')}
                        </Button>
                        <Button
                          id="yesulin"
                          className={`${tab === 'yesulin' ? 'active' : ''}`}
                          onClick={() => saveClicked('yesulin')}
                        >
                          {t('yesulin_btn')}
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <Button
                          id="jungang"
                          className={`${tab === 'jungang' ? 'active' : ''}`}
                          onClick={() => saveClicked('jungang')}
                        >
                          {t('jungang_btn')}
                        </Button>
                        <Button
                          id="shuttlecoke_i"
                          className={`${
                            tab === 'shuttlecoke_i' ? 'active' : ''
                          }`}
                          onClick={() => saveClicked('shuttlecoke_i')}
                        >
                          {t('shuttlecoke_i_btn')
                            .split('\n')
                            .map((c, i) => {
                              return (
                                <span key={i} className="whitespace-nowrap">
                                  {c}
                                </span>
                              )
                            })}
                        </Button>

                        <Button
                          id="residence"
                          className={`${tab === 'residence' ? 'active' : ''}`}
                          onClick={() => saveClicked('residence')}
                        >
                          {t('residence_btn')}
                        </Button>
                      </div>

                      <Link to="/all">
                        <Button id="all" className="w-full cursor-default">
                          {t('all_btn')}
                        </Button>
                      </Link>
                      <p
                        id="copyright"
                        className="dark:text-white pt-3 hsm:text-sm hsm:leading-4"
                      >
                        Copyright © 2020-2023{' '}
                        <a
                          className="underline"
                          target="_blank"
                          href="https://github.com/BusHanyang"
                          rel="noreferrer"
                        >
                          BusHanyang
                        </a>
                        . All rights reserved
                      </p>
                    </Apps>
                  </div>
                </PullToRefresh>
                <Suspense fallback={<div />}>
                  <ModalOpen
                    isModalAni={modalAni}
                    isOpen={modalOpen}
                    openModal={openModal}
                    closeModal={closeModal}
                    mTarget={modalTarget}
                  />
                </Suspense>
              </>
            }
          />
          <Route
            path="/all"
            element={
              <Suspense fallback={<div />}>
                <FullTime />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
