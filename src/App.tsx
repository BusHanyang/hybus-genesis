//import './App.css'

import React, { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import PullToRefresh from 'react-simple-pull-to-refresh'
import styled from 'styled-components'
import { Reset } from 'styled-reset'
import tw from 'twin.macro'

import { Card, Fabs } from './app/components'
import Notice from './app/components/Notice'
import Refreshing from './app/components/ptr/refreshing-content'
import { useDarkMode } from './app/components/useDarkMode'

const FullTime = lazy(() => import('./app/components/FullTime'))
const ModalOpen = lazy(() => import('./app/components/modal/modalOpen'))

const Apps = styled.div`
  ${tw`
    h-screen pl-5 pr-5 bg-white text-black font-Ptd text-center mx-auto select-none
    dark:bg-zinc-800 dark:text-white
  `}
`

const CardView = styled.div`
  ${tw`
    mb-3 justify-center items-center font-medium 
    bg-white rounded-lg drop-shadow-[0_3px_4px_rgba(10,10,10,0.2)] will-change-transform
    dark:bg-gray-700 dark:border-gray-700 dark:text-white dark:drop-shadow-[0_4px_3px_rgba(10,10,10,0.3)]
  `}
`
const Button = styled(CardView)`
  ${tw`
    flex will-change-transform overflow-hidden break-words whitespace-pre-line
    hover:bg-blue-100 hover:text-black border-none px-2 py-6 dark:text-white
  `}
  &.active {
    ${tw`
      bg-blue-300 dark:text-black drop-shadow-none shadow-inner transition-all ease-out duration-700
    `}
  }
`

function App() {
  const [modalOpen, setModalOpen] = useState(false)

  const openModal = () => {
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
  }

  const colorDarkMod = '#27272a' //bg-zinc-800
  let dark = 'white'
  let color = 'white'

  if (useDarkMode()[0] === 'dark') {
    dark = 'dark'
    color = colorDarkMod
  }

  const handleRefresh = (): Promise<React.FC> => {
    return new Promise(() => {
      location.reload()
    })
  }

  const { t, i18n } = useTranslation()

  const [themeMode, toggleTheme] = useDarkMode()
  const [tab, setTab] = useState<string>('')

  const saveClicked = (stn: string) => {
    window.localStorage.setItem('tab', stn)
    setTab(stn)
  }

  useEffect(() => {
    const whatlang = window.localStorage.getItem('lang') || i18n.language
    if (whatlang === 'ko') {
      i18n.changeLanguage('ko')
    } else {
      i18n.changeLanguage('en')
    }
    window.localStorage.setItem('lang', i18n.language)
  }, [i18n])

  useEffect(() => {
    const aTab = window.localStorage.getItem('tab') || 'shuttlecoke_o'
    saveClicked(aTab)
  }, [tab])

  return (
    <>
      <Reset />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Fabs openModal={openModal} />
                <PullToRefresh
                  onRefresh={handleRefresh}
                  backgroundColor={color}
                  pullingContent=""
                  refreshingContent={<Refreshing mode={dark} />}
                  resistance={3}
                >
                  <div className={`${themeMode === 'dark' ? 'dark' : ''}`}>
                    <Apps>
                      <header className="App-header">
                        <h1
                          id="title"
                          className="font-bold p-3 text-3xl pt-6 pb-3"
                        >
                          {t('title')}
                        </h1>
                        <CardView className="p-3 h-[3rem] w-full">
                          <Notice />
                        </CardView>
                      </header>

                      <CardView className="p-6 h-[17rem] hm:p-4">
                        {
                          <Card
                            location={
                              window.localStorage.getItem('tab') ||
                              'shuttlecoke_o'
                            }
                          />
                        }
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
                          id="residence"
                          className={`${tab === 'residence' ? 'active' : ''}`}
                          onClick={() => saveClicked('residence')}
                        >
                          {t('residence_btn')}
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          id="shuttlecoke_i"
                          className={`${
                            tab === 'shuttlecoke_i' ? 'active' : ''
                          }`}
                          onClick={() => saveClicked('shuttlecoke_i')}
                        >
                          {t('shuttlecoke_i_btn')}
                        </Button>

                        <Button
                          id="yesulin"
                          className={`${tab === 'yesulin' ? 'active' : ''}`}
                          onClick={() => saveClicked('yesulin')}
                        >
                          {t('yesulin_btn')}
                        </Button>
                      </div>

                      <Link to="/all">
                        <Button id="all" className="w-full">
                          {t('all_btn')}
                        </Button>
                      </Link>
                      <p id="copyright" className="dark:text-white pt-3">
                        Copyright © 2020-2022{' '}
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
                    isOpen={modalOpen}
                    openModal={openModal}
                    closeModal={closeModal}
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
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
