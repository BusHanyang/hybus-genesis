//import './App.css'

import React, { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import PullToRefresh from 'react-simple-pull-to-refresh'
import styled from 'styled-components'
import { Reset } from 'styled-reset'
import tw from 'twin.macro'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { Card, Fabs } from './app/components'
import Notice from './app/components/Notice'
import Refreshing from './app/components/ptr/refreshing-content'
import { THEME, useDarkmodeContext } from './app/context/ThemeContext'

const FullTime = lazy(() => import('./app/components/FullTime'))
const ModalOpen = lazy(() => import('./app/components/modal/modalOpen'))

const Apps = styled.div`
  ${tw`relative h-full pl-5 pr-5 mx-auto text-center text-black bg-white select-none font-Ptd max-w-7xl dark:bg-zinc-800 dark:text-white`}
`

const Circle = styled.span`
  ${tw`
    flex rounded-full inline-block
    h-3 w-3 rt1:h-2.5 rt1:w-2.5
  `}
`
const RouteText = styled.div`
  ${tw`inline-block rt1:text-sm rt2:text-xs hsm:mx-1`}
`

const CardView = styled.div`
  ${tw`
    mb-3 justify-center items-center font-medium 
    bg-white rounded-lg shadow-[0_2.8px_8px_rgba(10,10,10,0.2)] will-change-transform
    dark:bg-gray-700 dark:border-gray-700 dark:text-white dark:shadow-[0_2.8px_8px_rgba(10,10,10,0.8)]
  `}
`
const Button = styled(CardView)`
  ${tw`flex px-2 py-6 overflow-hidden border-none cursor-default will-change-transform hm:py-4 hm:text-sm hm:leading-4 dark:text-white`}
  &.active {
    ${tw`transition-all duration-700 ease-out bg-blue-300 shadow-inner dark:text-black drop-shadow-none`}
  }

  &#shuttlecoke_i {
    ${tw`items-center justify-center shuttlei:flex-col shuttlei:gap-x-0 gap-x-1`}
  }
`

const DARK_MODE_COLOR = '#27272a' //bg-zinc-800

function App() {
  const [modalTarget, setModalTarget] = useState<string>('')
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalAni, setModalAni] = useState<boolean>(false)
  const [triggered, setTriggered] = useState<boolean>(false)
  const [touchPrompt, setTouchPrompt] = useState<boolean>(
    window.localStorage.getItem('touch_info') === null
  )
  const intervalMS = 60 * 1000

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
  const isDarkMode = theme === THEME.DARK

  const saveClicked = (stn: string) => {
    window.localStorage.setItem('tab', stn)
    setTab(stn)
  }

  const { updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swURL, r) {
      r &&
        setInterval(async () => {
          if (!(!r.installing && navigator)) return
          if ('connection' in navigator && !navigator.onLine) return

          const resp = await fetch(swURL, {
            cache: 'no-store',
            headers: {
              cache: 'no-store',
              'cache-control': 'no-cache',
            },
          })

          if (resp?.status === 200) {
            await r.update()
          }
        }, intervalMS)
    },
  })

  useEffect(() => {
    const whatlang = window.localStorage.getItem('lang') || i18n.language
    if (whatlang === 'en') {
      i18n.changeLanguage('en')
    } else {
      i18n.changeLanguage('ko')
    }
    window.localStorage.setItem('lang', i18n.language)
  }, [i18n])

  useEffect(() => {
    const aTab = window.localStorage.getItem('tab') || 'shuttlecoke_o'
    saveClicked(aTab)
  }, [tab])

  useEffect(() => {
    document.body.classList.add('h-full')
    document.documentElement.classList.add('h-full')
    document.documentElement.classList.add('h-dfull')
  }, [])

  useEffect(() => {
    if (!triggered) {
      const triggerUpdate = async () => {
        await updateServiceWorker()
        setTriggered(true)
      }
      triggerUpdate().then(() => {
        console.log('App Update Triggered.')
      })
    }
  }, [triggered, updateServiceWorker])

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
                  <div className={`${isDarkMode ? 'dark' : ''} h-full`}>
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
                              onClick={handleModalTarget}
                              className="absolute right-0 bottom-3 h-9 w-9 dark:invert hsm:h-8 hsm:w-8"
                            ></img>
                          </h1>
                        </div>
                        <CardView className="p-3 h-[3rem] w-full">
                          <Notice />
                        </CardView>
                      </header>

                      <CardView
                        className={
                          touchPrompt
                            ? `p-6 hm:p-4 h-[18rem]`
                            : `p-6 hm:p-4 h-[17rem]`
                        }
                      >
                        {
                          <Card
                            location={
                              window.localStorage.getItem('tab') ||
                              'shuttlecoke_o'
                            }
                          />
                        }
                      </CardView>
                      <CardView className="flex h-12 p-4 hm:p-2">
                        <div>
                          <Circle className="mr-2 bg-chip-red hsm:mx-2" />
                          <RouteText>{t('cycle_index')}</RouteText>
                        </div>
                        <div>
                          <Circle className="mx-2 bg-chip-blue" />
                          <RouteText>{t('direct_index')}</RouteText>
                        </div>
                        <div>
                          <Circle className="mx-2 bg-chip-green" />
                          <RouteText>{t('yesulin_index')}</RouteText>
                        </div>
                        <div>
                          <Circle className="mx-2 bg-chip-purple" />
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
                        className="pt-3 dark:text-white hsm:text-sm hsm:leading-4"
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
