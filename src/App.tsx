//import './App.css'

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { Reset } from 'styled-reset'

import { Card } from './app/components'
import { Fabs } from './app/components'
import FullTime from './app/components/FullTime'
import { ModalOpen } from './app/components/modal/modalOpen'
import Notice from './app/components/Notice'
import Refreshing from './app/components/ptr/refreshing-content'
import { useDarkMode } from './app/components/useDarkMode'

function App() {
  const [modalOpen, setModalOpen] = useState(false)

  const openModal = () => {
    setModalOpen(true);
  }

  const closeModal = () => {
    setModalOpen(false);
  };

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

  const { t } = useTranslation()

  const [themeMode, toggleTheme] = useDarkMode()
  const [tab, setTab] = useState<string>('')

  const saveClicked = (stn: string) => {
    window.localStorage.setItem('tab', stn)
    setTab(stn)
  }

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
                <Fabs openModal={openModal}/>
                <PullToRefresh
                  onRefresh={handleRefresh}
                  backgroundColor={color}
                  pullingContent=""
                  refreshingContent={<Refreshing mode={dark} />}
                >
                  <div className={`${themeMode === 'dark' ? 'dark' : ''}`}>
                    <div className="h-screen App">
                      <header className="App-header">
                        <h1 id="title" className="dark:text-white">
                          {t('title')}
                        </h1>
                        <Notice />
                      </header>

                      <div id="time" className="card bus">
                        {
                          <Card
                            location={
                              window.localStorage.getItem('tab') ||
                              'shuttlecoke_o'
                            }
                          />
                        }
                      </div>
                      <div className="btn_group">
                        <button
                          id="shuttlecoke_o"
                          className={`card btn ${
                            tab === 'shuttlecoke_o' ? 'active' : ''
                          }`}
                          onClick={() => saveClicked('shuttlecoke_o')}
                        >
                          {t('shuttlecoke_o_btn')}
                        </button>
                        <button
                          id="subway"
                          className={`card btn ${
                            tab === 'subway' ? 'active' : ''
                          }`}
                          onClick={() => saveClicked('subway')}
                        >
                          {t('subway_btn')}
                        </button>
                        <button
                          id="residence"
                          className={`card btn ${
                            tab === 'residence' ? 'active' : ''
                          }`}
                          onClick={() => saveClicked('residence')}
                        >
                          {t('residence_btn')}
                        </button>
                      </div>

                      <div className="btn_group">
                        <button
                          id="shuttlecoke_i"
                          className={`card btn ${
                            tab === 'shuttlecoke_i' ? 'active' : ''
                          }`}
                          onClick={() => saveClicked('shuttlecoke_i')}
                        >
                          {t('shuttlecoke_i_btn')}
                        </button>

                        <button
                          id="yesulin"
                          className={`card btn ${
                            tab === 'yesulin' ? 'active' : ''
                          }`}
                          onClick={() => saveClicked('yesulin')}
                        >
                          {t('yesulin_btn')}
                        </button>
                      </div>

                      <Link to="/all">
                        <div id="all" className="card btn w-full">
                          {t('all_btn')}
                        </div>
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
                    </div>
                  </div>
                </PullToRefresh>
                <ModalOpen isOpen={modalOpen} openModal={openModal} closeModal={closeModal}></ModalOpen>
              </>
            }
          />
          <Route path="/all" element={<FullTime />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
