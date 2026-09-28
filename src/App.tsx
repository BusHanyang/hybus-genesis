import { classed } from '@tw-classed/react'
import React, { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import PullToRefresh from 'react-simple-pull-to-refresh'

import HelpImg from '/public/image/help_outline_24dp.svg?react'
import ThemeDebugMenu from '@/components/debug/ThemeDebugMenu'
import Fabs from '@/components/fab/fab'
import RouteMap from '@/components/routemap/RouteMap'
import StopPicker from '@/components/shuttle/StopPicker'
import TimetableCard, {
  isStopTab,
  StopTab,
} from '@/components/shuttle/TimetableCard'
import { runThemeTransition } from '@/components/theme/themeTransition'
import { useDarkMode } from '@/components/useDarkMode'
import {
  isSeasonalTheme,
  normalizeTheme,
  SEASONAL_THEME_ENABLED_STORAGE_KEY,
  THEME,
  useDarkmodeContext,
} from '@/context/ThemeContext'

import Refreshing from './app/components/ptr/refreshing-content'

const Notice = lazy(() => import('@/components/notice/Notice'))
const FullTime = lazy(() => import('@/components/fulltime/FullTime'))
const ModalOpen = lazy(() => import('@/components/modal/modalOpen'))

const CURRENT_YEAR = new Date().getFullYear()

const cardBase =
  'justify-center items-center font-medium text-theme-text bg-theme-card shadow-theme-shadow transition-[background-color,color,box-shadow] duration-[350ms]'
const themeRootVariants = {
  variants: {
    'data-theme': {
      light: 'light',
      dark: 'dark',
      christmas: 'christmas',
      spring: 'spring',
      summer: 'summer',
      autumn: 'autumn',
      winter: 'winter',
    },
  },
  defaultVariants: {
    'data-theme': 'light',
  },
} as const

const ThemeRoot = classed('div', 'relative min-h-dvh', themeRootVariants)
const Apps = classed(
  'div',
  'min-h-dvh px-5 pb-26 font-Ptd text-center mx-auto select-none max-w-[30rem] relative bg-theme-main text-theme-text transition-colors duration-[350ms]',
)
const CopyRightText = classed(
  'p',
  'mt-4 text-[12.5px] leading-normal font-medium text-ink-2',
)
const NoticeWrapper = classed(
  'div',
  `${cardBase} flex h-12 w-full items-center overflow-hidden rounded-2xl px-4 text-left`,
)
const FulltimeButton = classed(
  'div',
  `${cardBase} mt-3 flex h-16 w-full items-center justify-center rounded-2xl text-[15px] font-semibold hm:h-12 transition-[background-color,color,box-shadow,scale] active:scale-[.96]`,
)
const TitleRow = classed(
  'div',
  'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center py-3',
)
const HeaderTools = classed('div', 'relative flex min-w-0 items-center')
const HelpButton = classed(
  'button',
  'ml-auto flex h-11 w-11 items-center justify-center transition-transform duration-150 active:scale-[.96]',
)
const HelpIcon = classed(HelpImg, 'h-7 w-7')
const Title = classed(
  'h1',
  'm-0 text-center text-[27px] font-extrabold tracking-[-0.03em] hm:text-[1.625rem]',
)

function App() {
  const [modalTarget, setModalTarget] = useState<string>('')
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalAni, setModalAni] = useState<boolean>(false)
  const [noticeIndex, setNoticeIndex] = useState<number | null>(null)
  const {
    theme,
    automaticSeasonTheme,
    manualSeasonalTheme,
    seasonalThemeEnabled,
  } = useDarkmodeContext()
  const {
    setAutomaticTheme,
    setBackground,
    setManualSeasonalThemeMode,
    setSeasonalThemeEnabledMode,
    setThemeMode,
    toggleTheme,
  } = useDarkMode()
  const seasonalChoiceHandledRef = useRef(false)
  const modalDismissTimeoutRef = useRef<number | null>(null)

  const handleContextMenu = (e: { preventDefault: () => void }) => {
    e.preventDefault()
  }

  const openModal = () => {
    if (modalDismissTimeoutRef.current !== null) {
      window.clearTimeout(modalDismissTimeoutRef.current)
      modalDismissTimeoutRef.current = null
    }
    setModalAni(false)
    setModalOpen(true)
  }

  const handleModalTarget = () => {
    openModal()
    setModalTarget('Info')
  }

  const handleNoticeModalOpen = (index: number) => {
    setNoticeIndex(index)
    setModalTarget('Notice')
    openModal()
  }

  const dismissModal = () => {
    if (modalDismissTimeoutRef.current !== null) return
    setModalAni(true)
    modalDismissTimeoutRef.current = window.setTimeout(() => {
      modalDismissTimeoutRef.current = null
      setModalAni(false)
      setModalOpen(false)
    }, 200)
  }

  const closeModal = () => {
    if (modalTarget === 'Seasonal') {
      if (seasonalChoiceHandledRef.current) return
      seasonalChoiceHandledRef.current = true
      setSeasonalThemeEnabledMode(false)
    }
    dismissModal()
  }

  const handleEnableSeasonalTheme = (origin: Element | null) => {
    if (seasonalChoiceHandledRef.current) return
    seasonalChoiceHandledRef.current = true
    runThemeTransition(origin, setAutomaticTheme)
    dismissModal()
  }

  const handleRefresh = (): Promise<React.FC> => {
    return new Promise(() => {
      location.reload()
    })
  }

  const { t, i18n } = useTranslation()

  const [tab, setTab] = useState<StopTab>(() => {
    const savedTab = window.localStorage.getItem('tab')
    return isStopTab(savedTab) ? savedTab : 'shuttlecoke_o'
  })
  const [realtimeMode, setRealtimeMode] = useState<boolean>(
    () => window.localStorage.getItem('realtimeMode') === 'sub',
  )

  const saveClicked = (stn: StopTab) => {
    window.localStorage.setItem('tab', stn)
    setTab(stn)
  }

  const realtimeClicked = (isOk: 'bus' | 'sub') => {
    window.localStorage.setItem('realtimeMode', isOk)
    setRealtimeMode(isOk === 'sub')
  }

  useEffect(() => {
    const savedLanguage =
      window.localStorage.getItem('language') || i18n.language
    const nextLanguage = savedLanguage === 'ko' ? 'ko' : 'en'
    window.localStorage.removeItem('lang')
    window.localStorage.setItem('language', nextLanguage)
    void i18n.changeLanguage(nextLanguage)
  }, [i18n])

  useEffect(() => {
    document.body.classList.add('h-full', 'hb-motion')
    document.documentElement.classList.add('h-full')
    document.documentElement.classList.add('h-dfull')
  }, [])

  useEffect(() => {
    return () => {
      if (modalDismissTimeoutRef.current !== null) {
        window.clearTimeout(modalDismissTimeoutRef.current)
        modalDismissTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    setBackground()
  }, [setBackground, theme])

  useEffect(() => {
    const automaticThemeIsVisible =
      seasonalThemeEnabled &&
      manualSeasonalTheme === null &&
      theme !== THEME.DARK

    if (automaticThemeIsVisible && theme !== automaticSeasonTheme) {
      setAutomaticTheme()
    }
  }, [
    automaticSeasonTheme,
    manualSeasonalTheme,
    seasonalThemeEnabled,
    setAutomaticTheme,
    theme,
  ])

  {/** 계절 테마를 아직 선택하지 않은 사용자의 최초 선택 */}
  useEffect(() => {
    const storedTheme = normalizeTheme(window.localStorage.getItem('theme'))
    const storedSeasonalPreference = window.localStorage.getItem(
      SEASONAL_THEME_ENABLED_STORAGE_KEY,
    )
    const hasStoredSeasonalPreference =
      storedSeasonalPreference === 'true' ||
      storedSeasonalPreference === 'false'

    if (!hasStoredSeasonalPreference && !isSeasonalTheme(storedTheme)) {
      seasonalChoiceHandledRef.current = false
      setModalTarget('Seasonal')
      setModalOpen(true)
    }
  }, [])

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <PullToRefresh
                  onRefresh={handleRefresh}
                  //backgroundColor={}
                  pullingContent=""
                  refreshingContent={<Refreshing mode={theme} />}
                  resistance={3}
                  //className="transition-colors"
                >
                  <ThemeRoot
                    data-theme={theme}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <Apps>
                      <header>
                        <TitleRow>
                          <span aria-hidden="true" />
                          <Title>{t('title')}</Title>
                          <HeaderTools>
                            {import.meta.env.DEV && (
                              <ThemeDebugMenu
                                theme={theme}
                                manualSeasonalTheme={manualSeasonalTheme}
                                seasonalThemeEnabled={seasonalThemeEnabled}
                                onSelectTheme={setThemeMode}
                                onSelectManualTheme={setManualSeasonalThemeMode}
                                onSelectAutomaticTheme={setAutomaticTheme}
                                onToggleTheme={toggleTheme}
                              />
                            )}
                            <HelpButton
                              type="button"
                              aria-label={t('info')}
                              aria-haspopup="dialog"
                              onClick={handleModalTarget}
                              onContextMenu={handleContextMenu}
                            >
                              <HelpIcon aria-hidden="true" />
                            </HelpButton>
                          </HeaderTools>
                        </TitleRow>
                        <NoticeWrapper>
                          <Suspense fallback={<div />}>
                            <Notice onOpen={handleNoticeModalOpen} />
                          </Suspense>
                        </NoticeWrapper>
                      </header>

                      <TimetableCard
                        tab={tab}
                        realtimeMode={realtimeMode}
                        onRealtimeModeChange={realtimeClicked}
                      />
                      <RouteMap tab={tab} />
                      <StopPicker tab={tab} onSelect={saveClicked} />

                      <Link to="/all">
                        <FulltimeButton id="all">{t('all_btn')}</FulltimeButton>
                      </Link>
                      <CopyRightText id="copyright">
                        Copyright © 2020-{CURRENT_YEAR}{' '}
                        <a
                          className="underline"
                          target="_blank"
                          href="https://github.com/BusHanyang"
                          rel="noreferrer"
                        >
                          BusHanyang
                        </a>
                        . All rights reserved
                      </CopyRightText>
                    </Apps>
                  </ThemeRoot>
                </PullToRefresh>
                <Fabs openModal={openModal} mTarget={setModalTarget} />
                <Suspense fallback={<div />}>
                  <ModalOpen
                    isModalAni={modalAni}
                    isOpen={modalOpen}
                    closeModal={closeModal}
                    mTarget={modalTarget}
                    noticeIndex={noticeIndex}
                    onEnableSeasonalTheme={handleEnableSeasonalTheme}
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
