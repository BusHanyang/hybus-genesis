import { classed } from '@tw-classed/react'
import React, { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { Transition } from 'react-transition-group'

import Arrow from '/public/image/expand_less_white_48dp.svg?react'
import HelpImg from '/public/image/help_outline_24dp.svg?react'
import ThemeDebugMenu from '@/components/debug/ThemeDebugMenu'
import Fabs from '@/components/fab/fab'
import StopPicker from '@/components/shuttle/StopPicker'
import TimetableCard, {
  isStopTab,
  StopTab,
} from '@/components/shuttle/TimetableCard'
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
const RouteMap = lazy(() => import('@/components/routemap/RouteMap'))

type RouteCardStatus = 'entering' | 'entered' | 'exiting' | 'exited' | 'exit'

const CURRENT_YEAR = new Date().getFullYear()

const cardBase =
  'justify-center items-center font-medium text-theme-text bg-theme-card shadow-theme-shadow transition-[background-color,color,box-shadow] duration-[350ms]'
const heightTransitionCardBase =
  'justify-center items-center font-medium text-theme-text bg-theme-card shadow-theme-shadow'
const circleBase =
  "relative flex rounded-full inline-block shrink-0 transition-transform h-3 w-3 rt1:h-2.5 rt1:w-2.5 hsm:my-1"
const circleThemeVariants = {
  variants: {
    'data-theme': {
      spring:
        "rotate-45 scale-75 rounded-none before:absolute before:left-[-50%] before:top-0 before:w-full before:h-full before:rounded-full before:bg-inherit before:content-[''] after:absolute after:left-0 after:top-[-50%] after:w-full after:h-full after:rounded-full after:bg-inherit after:content-['']",
      default: '',
    },
  },
  defaultVariants: {
    'data-theme': 'default',
  },
} as const

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

const ThemeRoot = classed(
  'div',
  'mobile-fab-scroll-root relative h-full',
  themeRootVariants,
)
const Apps = classed(
  'div',
  'mobile-fab-scroll-content h-full px-5 pb-26 font-Ptd text-center mx-auto select-none max-w-7xl relative bg-theme-main text-theme-text transition-colors duration-[350ms]',
)
const CopyRightText = classed(
  'p',
  'mt-4 text-[12.5px] leading-normal font-medium text-ink-2',
)
const CycleCircle = classed('span', `${circleBase} bg-chip-red mr-2 hsm:mx-2`, circleThemeVariants)
const DirectCircle = classed('span', `${circleBase} bg-chip-blue mx-2`, circleThemeVariants)
const YesulinCircle = classed('span', `${circleBase} bg-chip-green mx-2`, circleThemeVariants)
const JungangCircle = classed('span', `${circleBase} bg-chip-purple mx-2`, circleThemeVariants)
const RouteText = classed('div', 'inline-block rt1:text-sm rt2:text-xs hsm:mx-1')
const NoticeWrapper = classed(
  'div',
  `${cardBase} flex h-12 w-full items-center overflow-hidden rounded-2xl px-4 text-left`,
)
const FulltimeButton = classed(
  'div',
  `${cardBase} mt-3 flex h-[54px] w-full items-center justify-center rounded-2xl text-[15px] font-semibold transition-[background-color,color,box-shadow,scale] active:scale-[.96]`,
)
const TitleRow = classed(
  'div',
  'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center pt-[18px] pb-3',
)
const HeaderTools = classed('div', 'relative flex min-w-0 items-center')
const HelpButton = classed(
  'button',
  'ml-auto flex h-11 w-11 items-center justify-center transition-transform duration-150 active:scale-[.96]',
)
const HelpIcon = classed(HelpImg, 'h-7 w-7')
const RouteIndexCardView = classed(
  'div',
  `${heightTransitionCardBase} relative mt-3 rounded-[20px] p-4 hm:p-2 transition-[height] ease-in-out duration-150`,
  {
    variants: {
      'data-status': {
        entered: 'h-[13.7rem] hm:h-[11.7rem]',
        entering: 'h-14 hsm:h-16',
        exiting: 'h-14 hsm:h-16',
        exited: 'h-14 hsm:h-16',
        exit: 'h-14 hsm:h-16',
      },
    },
    defaultVariants: {
      'data-status': 'exited',
    },
  },
)
const RouteIndexWrapper = classed('div', 'flex flex-wrap place-content-center items-center')
const RouteIndexContainer = classed(
  'div',
  'absolute top-0 inset-0 flex place-content-center items-center transition ease-in-out duration-300',
  {
    variants: {
      'data-status': {
        entered: 'opacity-0 hidden',
        exited: 'opacity-100',
        entering: 'opacity-0',
        exiting: 'opacity-0',
        exit: 'opacity-0',
      },
    },
    defaultVariants: {
      'data-status': 'exited',
    },
  },
)
const RouteToggleImage = classed(
  Arrow,
  'absolute bottom-0 inset-x-0 m-auto h-[1.2rem] w-[1.2rem] opacity-80 transition ease-in-out duration-150',
  {
    variants: {
      'data-status': {
        entered: 'rotate-0',
        entering: 'rotate-180',
        exiting: 'rotate-180',
        exited: 'rotate-180',
        exit: 'rotate-180',
      },
    },
    defaultVariants: {
      'data-status': 'exited',
    },
  },
)
const Title = classed(
  'h1',
  'm-0 text-center text-[27px] font-extrabold tracking-[-0.03em] hm:text-[1.625rem]',
)

function App() {
  const [modalTarget, setModalTarget] = useState<string>('')
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalAni, setModalAni] = useState<boolean>(false)
  const [noticeContent, setNoticeContent] = useState<string>('')
  const [noticeTitle, setNoticeTitle] = useState<string>('')
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
  const [routeCardClick, setRouteCardClick] = useState<boolean>(false)
  const routeCardRef = useRef<HTMLDivElement>(null)
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

  const handleNoticeModalOpen = (content: string, title: string) => {
    setNoticeContent(content)
    setNoticeTitle(title)
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
    }, 300)
  }

  const closeModal = () => {
    if (modalTarget === 'Seasonal') {
      if (seasonalChoiceHandledRef.current) return
      seasonalChoiceHandledRef.current = true
      setSeasonalThemeEnabledMode(false)
    }
    dismissModal()
  }

  const handleEnableSeasonalTheme = () => {
    if (seasonalChoiceHandledRef.current) return
    seasonalChoiceHandledRef.current = true
    setAutomaticTheme()
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
                    <Fabs openModal={openModal} mTarget={setModalTarget} />
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
                            <Notice onModalOpen={handleNoticeModalOpen} />
                          </Suspense>
                        </NoticeWrapper>
                      </header>

                      <TimetableCard
                        tab={tab}
                        realtimeMode={realtimeMode}
                        onRealtimeModeChange={realtimeClicked}
                      />
                      <Transition
                        in={routeCardClick}
                        nodeRef={routeCardRef}
                        timeout={150}
                      >
                        {(state) => (
                          <>
                            <RouteIndexCardView
                              ref={routeCardRef}
                              data-status={state as RouteCardStatus}
                              onClick={() => {
                                setRouteCardClick(!routeCardClick)
                              }}
                            >
                              <RouteIndexContainer
                                data-status={state as RouteCardStatus}
                              >
                                <RouteIndexWrapper>
                                  <CycleCircle
                                    data-theme={
                                      theme === 'spring' ? 'spring' : 'default'
                                    }
                                  />
                                  <RouteText>{t('cycle_index')}</RouteText>
                                </RouteIndexWrapper>
                                <RouteIndexWrapper>
                                  <DirectCircle
                                    data-theme={
                                      theme === 'spring' ? 'spring' : 'default'
                                    }
                                  />
                                  <RouteText>{t('direct_index')}</RouteText>
                                </RouteIndexWrapper>
                                <RouteIndexWrapper>
                                  <YesulinCircle
                                    data-theme={
                                      theme === 'spring' ? 'spring' : 'default'
                                    }
                                  />
                                  <RouteText>{t('yesulin_index')}</RouteText>
                                </RouteIndexWrapper>
                                <RouteIndexWrapper>
                                  <JungangCircle
                                    data-theme={
                                      theme === 'spring' ? 'spring' : 'default'
                                    }
                                  />
                                  <RouteText>{t('jungang_index')}</RouteText>
                                </RouteIndexWrapper>
                              </RouteIndexContainer>
                              <RouteMap status={state} tab={tab} />
                              <RouteToggleImage
                                fill="var(--color-arrow-color)"
                                data-status={state as RouteCardStatus}
                              />
                            </RouteIndexCardView>
                          </>
                        )}
                      </Transition>
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
                <Suspense fallback={<div />}>
                  <ModalOpen
                    isModalAni={modalAni}
                    isOpen={modalOpen}
                    closeModal={closeModal}
                    mTarget={modalTarget}
                    noticeContent={noticeContent}
                    noticeTitle={noticeTitle}
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
