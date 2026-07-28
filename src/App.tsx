import { classed } from '@tw-classed/react'
import React, { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { Transition } from 'react-transition-group'

import Arrow from '/public/image/expand_less_white_48dp.svg?react'
import HelpImg from '/public/image/helpblack.svg?react'
import { Shuttle } from '@/components'
import ThemeDebugMenu from '@/components/debug/ThemeDebugMenu'
import Fabs from '@/components/fab/fab'
import { useDarkMode } from '@/components/useDarkMode'
import {
  isSeasonalTheme,
  normalizeTheme,
  SEASONAL_THEME_ENABLED_STORAGE_KEY,
  THEME,
  useDarkmodeContext,
} from '@/context/ThemeContext'
import { StopLocation } from '@/data'

import Refreshing from './app/components/ptr/refreshing-content'

const Notice = lazy(() => import('@/components/notice/Notice'))
const FullTime = lazy(() => import('@/components/fulltime/FullTime'))
const ModalOpen = lazy(() => import('@/components/modal/modalOpen'))
const Subway = lazy(() => import('@/components/subway/Subway'))
const RouteMap = lazy(() => import('@/components/routemap/RouteMap'))

type RouteCardStatus = 'entering' | 'entered' | 'exiting' | 'exited' | 'exit'
type MainCardHeight =
  | 'defaultNoPrompt'
  | 'stationNoPrompt'
  | 'stationPromptBus'
  | 'stationPromptRealtime'
  | 'defaultPrompt'

const cardShellBase =
  'mb-3 justify-center items-center font-medium rounded-lg transition-colors text-theme-text border-theme-border shadow-theme-shadow'
const buttonShellBase =
  'mb-3 justify-center items-center font-medium rounded-lg transition-colors border-theme-border shadow-theme-shadow'
const cardBase = `${cardShellBase} bg-theme-card`
const heightTransitionCardBase =
  'mb-3 justify-center items-center font-medium rounded-lg text-theme-text border-theme-border shadow-theme-shadow bg-theme-card'
const buttonBase =
  'flex will-change-transform overflow-hidden cursor-default border-none px-2 py-6 hm:py-4 hm:text-sm hm:leading-4'
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

const ThemeRoot = classed('div', 'h-full', themeRootVariants)
const Apps = classed(
  'div',
  'h-full pl-5 pr-5 font-Ptd text-center mx-auto select-none max-w-7xl relative bg-theme-main text-theme-text transition-colors',
)
const CopyRightText = classed('p', 'text-theme-text pt-3 hsm:text-sm hsm:leading-4')
const CycleCircle = classed('span', `${circleBase} bg-chip-red mr-2 hsm:mx-2`, circleThemeVariants)
const DirectCircle = classed('span', `${circleBase} bg-chip-blue mx-2`, circleThemeVariants)
const YesulinCircle = classed('span', `${circleBase} bg-chip-green mx-2`, circleThemeVariants)
const JungangCircle = classed('span', `${circleBase} bg-chip-purple mx-2`, circleThemeVariants)
const RouteText = classed('div', 'inline-block rt1:text-sm rt2:text-xs hsm:mx-1')
const MainCardView = classed(
  'div',
  `${heightTransitionCardBase} p-6 hm:p-4 transition-all`,
  {
    variants: {
      'data-height': {
        defaultNoPrompt: 'h-68',
        stationNoPrompt: 'h-[19.6rem]',
        stationPromptBus: 'h-84 hm:h-86 hsm:h-[20.7rem]',
        stationPromptRealtime: 'h-[19.6rem]',
        defaultPrompt: 'h-74 hm:h-76 hsm:h-74',
      },
    },
    defaultVariants: {
      'data-height': 'defaultNoPrompt',
    },
  },
)
const NoticeWrapper = classed('div', `${cardBase} p-3 h-12 w-full`)
const SubwayFallback = classed('div', 'h-[14.8rem] hm:h-[15.3rem]')
const Button = classed('div', `${buttonShellBase} ${buttonBase}`, {
  variants: {
    'data-state': {
      active:
        'bg-button-active text-black drop-shadow-none shadow-inner transition-all ease-out duration-700',
      idle: 'bg-theme-card text-theme-text',
    },
    'data-location': {
      'shuttlecoke_i': 'shuttlei:flex-col shuttlei:gap-x-0 gap-x-1',
      default: '',
    },
  },
  defaultVariants: {
    'data-state': 'idle',
    'data-location': 'default',
  },
})
const FulltimeButton = classed('div', `${cardBase} ${buttonBase} w-full cursor-default`)
const HeadlineWrapper = classed('div', 'relative drag-save-n')
const TitleRow = classed('div', 'grid grid-cols-[1fr_auto_1fr] items-center')
const HelpIcon = classed(
  HelpImg,
  'bottom-3 right-0 absolute h-9 w-9 hsm:h-8 hsm:w-8 cursor-default drag-save-n',
)
const RouteIndexCardView = classed(
  'div',
  `${heightTransitionCardBase} relative p-4 hm:p-2 transition-[height] ease-in-out duration-150`,
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
const SegmentedControl = classed(
  'div',
  'relative p-1 w-[16rem] hsm:w-56 text-sm hsm:text-xs items-center grid grid-cols-2 gap-3 rounded-3xl bg-control-main will-change-transform',
)
const SegmentedControlWrapper = classed(
  'div',
  'flex justify-center transition-[opacity,margin]',
  {
    variants: {
      'data-offset': {
        prompt: 'mt-7 hm:mt-[2.1rem] hsm:mt-7',
        default: '',
      },
      'data-visibility': {
        visible: 'opacity-100 pointer-events-auto',
        hidden: 'opacity-0 pointer-events-none',
      },
    },
    defaultVariants: {
      'data-offset': 'default',
      'data-visibility': 'hidden',
    },
  },
)
const OptionWrapper = classed('div', 'relative z-10 flex items-center justify-center')
const ActiveIndicator = classed(
  'div',
  'fixed w-[45%] h-[75%] bg-control-active transition-transform rounded-2xl duration-300 ease-in-out',
  {
    variants: {
      'data-index': {
        bus: 'translate-x-[5%]',
        subway: 'translate-x-[117%]',
      },
    },
    defaultVariants: {
      'data-index': 'bus',
    },
  },
)
const StationButtonWrapper = classed('div', 'grid grid-cols-3 gap-4')
const RadioLabel = classed(
  'label',
  'w-full h-full block cursor-pointer select-none rounded-xl p-1 text-center peer-checked:font-bold peer-checked:text-white transition-colors duration-300',
)
const Title = classed('h1', 'font-bold p-3 text-3xl hm:text-[1.625rem] static pt-6 pb-3')

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
  const [touchPrompt, setTouchPrompt] = useState<boolean>(
    window.localStorage.getItem('touch_info') === null,
  )

  const [routeCardClick, setRouteCardClick] = useState<boolean>(false)
  const routeCardRef = useRef<HTMLDivElement>(null)
  const seasonalChoiceHandledRef = useRef(false)

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

  const handleNoticeModalOpen = (content: string, title: string) => {
    setNoticeContent(content)
    setNoticeTitle(title)
    setModalTarget('Notice')
    openModal()
  }

  const dismissModal = () => {
    setModalAni(true)
    setTimeout(() => {
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

  const [tab, setTab] = useState<string>('')
  const [realtimeMode, setRealtimeMode] = useState<boolean>(false)

  const saveClicked = (stn: string) => {
    window.localStorage.setItem('tab', stn)
    setTab(stn)
  }

  const realtimeClicked = (isOk: string) => {
    window.localStorage.setItem('realtimeMode', isOk)
    setRealtimeMode(isOk === 'sub')
  }

  const getCardHeight = (): MainCardHeight => {
    if (!touchPrompt) {
      if (tab === 'subway' || tab === 'jungang') {
        // No prompt at Stations
        return 'stationNoPrompt'
      } else {
        // default (No prompt)
        return 'defaultNoPrompt'
      }
    } else {
      if (tab === 'subway' || tab === 'jungang') {
        if (!realtimeMode) {
          // Shuttle Bus Info at Stations with prompt
          return 'stationPromptBus'
        } else {
          // Subway info at Stations with prompt
          return 'stationPromptRealtime'
        }
      } else {
        // default with prompt
        return 'defaultPrompt'
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

  useEffect(() => {
    const status = window.localStorage.getItem('touch_info') === null
    setTouchPrompt(status)
  }, [])

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
                <Fabs openModal={openModal} mTarget={setModalTarget} />
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
                        <HeadlineWrapper>
                          <TitleRow>
                            <span aria-hidden="true" />
                            <Title>{t('title')}</Title>
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
                          </TitleRow>
                          <HelpIcon
                            aria-label="information icon"
                            onClick={handleModalTarget}
                            onContextMenu={handleContextMenu}
                            //draggable="false"
                            fill="var(--color-theme-text)"
                          ></HelpIcon>
                        </HeadlineWrapper>
                        <NoticeWrapper>
                          <Suspense fallback={<div />}>
                            <Notice onModalOpen={handleNoticeModalOpen} />
                          </Suspense>
                        </NoticeWrapper>
                      </header>

                      <MainCardView data-height={getCardHeight()}>
                        {realtimeMode &&
                        (tab === 'subway' || tab === 'jungang') ? (
                          <>
                            <Suspense fallback={<SubwayFallback />}>
                              <Subway
                                station={(tab === 'subway'
                                  ? '한대앞'
                                  : '중앙'
                                ).trim()}
                              />
                            </Suspense>
                          </>
                        ) : (
                          <>
                            <Shuttle
                              location={
                                (window.localStorage.getItem('tab') ||
                                  'shuttlecoke_o') as StopLocation
                              }
                            />
                          </>
                        )}
                        <SegmentedControlWrapper
                          data-offset={
                            !realtimeMode && touchPrompt ? 'prompt' : 'default'
                          }
                          data-visibility={
                            tab === 'subway' || tab === 'jungang'
                              ? 'visible'
                              : 'hidden'
                          }
                        >
                          <SegmentedControl>
                            <ActiveIndicator
                              data-index={realtimeMode ? 'subway' : 'bus'}
                            />
                            <OptionWrapper>
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
                            </OptionWrapper>
                            <OptionWrapper>
                              <input
                                type="radio"
                                name="option"
                                id="2"
                                value="2"
                                className="peer hidden"
                                onChange={() => realtimeClicked('sub')}
                                checked={realtimeMode}
                              />
                              <RadioLabel htmlFor="2">{t('subw')}</RadioLabel>
                            </OptionWrapper>
                          </SegmentedControl>
                        </SegmentedControlWrapper>
                      </MainCardView>
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
                      <StationButtonWrapper>
                        <Button
                          id="shuttlecoke_o"
                          data-state={
                            tab === 'shuttlecoke_o' ? 'active' : 'idle'
                          }
                          onClick={() => saveClicked('shuttlecoke_o')}
                        >
                          {t('shuttlecoke_o_btn')}
                        </Button>
                        <Button
                          id="subway"
                          data-state={tab === 'subway' ? 'active' : 'idle'}
                          onClick={() => saveClicked('subway')}
                        >
                          {t('subway_btn')}
                        </Button>
                        <Button
                          id="yesulin"
                          data-state={tab === 'yesulin' ? 'active' : 'idle'}
                          onClick={() => saveClicked('yesulin')}
                        >
                          {t('yesulin_btn')}
                        </Button>
                      </StationButtonWrapper>
                      <StationButtonWrapper>
                        <Button
                          id="jungang"
                          data-state={tab === 'jungang' ? 'active' : 'idle'}
                          onClick={() => saveClicked('jungang')}
                        >
                          {t('jungang_btn')}
                        </Button>
                        <Button
                          id="shuttlecoke_i"
                          data-location="shuttlecoke_i"
                          data-state={
                            tab === 'shuttlecoke_i' ? 'active' : 'idle'
                          }
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
                          data-state={tab === 'residence' ? 'active' : 'idle'}
                          onClick={() => saveClicked('residence')}
                        >
                          {t('residence_btn')}
                        </Button>
                      </StationButtonWrapper>

                      <Link to="/all">
                        <FulltimeButton id="all">{t('all_btn')}</FulltimeButton>
                      </Link>
                      <CopyRightText id="copyright">
                        Copyright © 2020-2025{' '}
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
