import React, { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { Transition } from 'react-transition-group'
import styled, { css } from 'styled-components'
import { Reset } from 'styled-reset'
import tw from 'twin.macro'

import Arrow from '/public/image/expand_less_white_48dp.svg?react'
import HelpImg from '/public/image/helpblack.svg?react'
import { Shuttle } from '@/components'
import Fabs from '@/components/fab/fab'
import { useDarkMode } from '@/components/useDarkMode'
import { useDarkmodeContext } from '@/context/ThemeContext'
import { StopLocation } from '@/data'

import Refreshing from './app/components/ptr/refreshing-content'

const Notice = lazy(() => import('@/components/notice/Notice'))
const FullTime = lazy(() => import('@/components/fulltime/FullTime'))
const ModalOpen = lazy(() => import('@/components/modal/modalOpen'))
const Subway = lazy(() => import('@/components/subway/Subway'))
const RouteMap = lazy(() => import('@/components/routemap/RouteMap'))

const Apps = styled.div`
  ${tw`
    h-full pl-5 pr-5 font-Ptd text-center mx-auto select-none max-w-7xl relative
    bg-theme-main text-theme-text transition-colors
  `}
`

const Circle = styled.span<{ theme: string }>`
  ${tw`
    flex rounded-full inline-block transition-transform
    h-3 w-3 rt1:h-2.5 rt1:w-2.5 hsm:my-1
  `}

  ${({ theme }) =>
    theme === 'spring' &&
    css`
      /* For Heart Shape */
      ${tw`rotate-45 scale-75 rounded-none`}

      &::before,&::after {
        ${tw`absolute w-full h-full rounded-full bg-inherit content-['']`}
      }
      &::before {
        left: -50%;
      }
      &::after {
        top: -50%;
      }
    `}
`

const CopyRightText = styled.p`
  ${tw`text-theme-text pt-3 hsm:text-sm hsm:leading-4`}
`

const CycleCircle = styled(Circle)`
  ${tw`bg-chip-red mr-2 hsm:mx-2`}
`

const DirectCircle = styled(Circle)`
  ${tw`bg-chip-blue mx-2`}
`

const YesulinCircle = styled(Circle)`
  ${tw`bg-chip-green mx-2`}
`

const JungangCircle = styled(Circle)`
  ${tw`bg-chip-purple mx-2`}
`

const RouteText = styled.div`
  ${tw`
    inline-block rt1:text-sm rt2:text-xs hsm:mx-1
  `}
`

const CardView = styled.div`
  ${tw`
    mb-3 justify-center items-center font-medium rounded-lg transition-colors
    bg-theme-card text-theme-text border-theme-border shadow-theme-shadow 
  `}
`

const MainCardView = styled(CardView)`
  ${tw`p-6 hm:p-4 transition-all`}
`

const NoticeWrapper = styled(CardView)`
  ${tw`p-3 h-[3rem] w-full`}
`

const Button = styled(CardView)`
  ${tw`
    flex will-change-transform overflow-hidden cursor-default 
    border-none px-2 py-6 hm:py-4 hm:text-sm hm:leading-4 text-theme-text 
  `}

  &.active {
    ${tw`
      bg-button-active text-black drop-shadow-none shadow-inner transition-all ease-out duration-700
    `}
  }

  &#shuttlecoke_i {
    ${tw`shuttlei:flex-col shuttlei:gap-x-0 gap-x-1 items-center justify-center`}
  }
`

const FulltimeButton = styled(Button)`
  ${tw`w-full cursor-default`}
`

const HeadlineWrapper = styled.div`
  ${tw`relative`} drag-save-n
`

const HelpIcon = styled(HelpImg)`
  ${tw`bottom-3 right-0 absolute h-9 w-9 hsm:h-8 hsm:w-8 cursor-default`} drag-save-n
`

const RouteIndexCardView = styled(CardView)<{ status: string }>`
  ${tw`relative p-4 h-12 hsm:h-20 hm:p-2 transition-[height] ease-in-out duration-150`}
  ${(props) =>
    props.status === 'entered'
      ? tw`h-[13.7rem] hm:h-[11.7rem]`
      : tw`h-14 hsm:h-16`}
`

const RouteIndexWrapper = styled.div`
  ${tw`flex flex-wrap place-content-center items-center`}
`

const RouteIndexContainer = styled.div<{ status: string }>`
  ${tw`absolute top-0 inset-0 flex place-content-center items-center transition ease-in-out duration-300`}
  ${(props) => (props.status === 'exited' ? tw`opacity-100` : tw`opacity-0`)}
  ${(props) => (props.status === 'entered' ? tw`hidden` : tw``)}
`
const RouteToggleImage = styled(Arrow)<{ status: string }>`
  ${tw`absolute bottom-0 inset-x-0 rotate-180 m-auto h-[1.2rem] w-[1.2rem] opacity-80 transition ease-in-out duration-150`}
  ${(props) => (props.status === 'entered' ? tw`rotate-0` : tw`rotate-180`)}
`
const SegmentedControl = styled.div`
  ${tw`
    relative p-1 w-[16rem] hsm:w-[14rem] text-sm hsm:text-xs items-center grid grid-cols-2 gap-3 rounded-3xl bg-control-main will-change-transform
  `}
`

const SegmentedControlWrapper = styled.div<{
  $realtimeMode: boolean
  $touchPrompt: boolean
  $tab: string
}>`
  ${tw`flex justify-center transition-[opacity,margin]`}
  ${({ $realtimeMode, $touchPrompt }) =>
    !$realtimeMode && $touchPrompt
      ? tw`mt-7 hm:mt-[2.1rem] hsm:mt-7`
      : undefined}
  ${({ $tab }) =>
    $tab === 'subway' || $tab === 'jungang'
      ? tw`opacity-100 pointer-events-auto`
      : tw`opacity-0 pointer-events-none`}
`

const OptionWrapper = styled.div`
  ${tw`relative z-10 flex items-center justify-center`}
`

const ActiveIndicator = styled.div<{ $activeIndex: number }>`
  ${tw`
    fixed w-[45%] h-[75%] bg-control-active transition-transform rounded-2xl duration-300 ease-in-out
  `}
  transform: translateX(${({ $activeIndex }) => $activeIndex}%);
`

const StationButtonWrapper = styled.div`
  ${tw`grid grid-cols-3 gap-4`}
`

const RadioLabel = styled.label`
  ${tw`
    w-full h-full block cursor-pointer select-none rounded-xl p-1 text-center
    peer-checked:font-bold peer-checked:text-white transition-colors duration-300
  `}
`

const Title = styled.h1`
  ${tw`font-bold p-3 text-3xl hm:text-[1.625rem] static pt-6 pb-3`}
`

function App() {
  const [modalTarget, setModalTarget] = useState<string>('')
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalAni, setModalAni] = useState<boolean>(false)
  const [noticeContent, setNoticeContent] = useState<string>('')
  const [noticeTitle, setNoticeTitle] = useState<string>('')
  const { toggleTheme } = useDarkMode()
  const [touchPrompt, setTouchPrompt] = useState<boolean>(
    window.localStorage.getItem('touch_info') === null,
  )
  {/** 테마 Alert state */}
  const [themeAlert, setThemeAlert] = useState<boolean>(
    // window.localStorage.getItem('xmas_alert') === null,
    // window.localStorage.getItem('spring_2025') === null,
    window.localStorage.getItem('frozen_2025') === null,
  )

  const [routeCardClick, setRouteCardClick] = useState<boolean>(false)
  
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
  const [realtimeMode, setRealtimeMode] = useState<boolean>(false)

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
          return 'h-[21rem] hm:h-[21.5rem] hsm:h-[20.7rem]'
        } else {
          // Subway info at Stations with prompt
          return 'h-[19.6rem]'
        }
      } else {
        // default with prompt
        return 'h-[18.5rem] hm:h-[19rem] hsm:h-[18.5rem]'
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
    const localTheme = window.localStorage.getItem('theme')
    if (localTheme) {
      if (localTheme === 'dark') {
        document.body.classList.remove('light')
        document.body.classList.remove('christmas')
        document.body.classList.remove('spring')
        document.body.classList.remove('frozen')
        document.body.classList.add('dark')
      } else if (localTheme === 'christmas' || localTheme === 'spring') {
        // 강제 light 적용
        document.body.classList.add('light')
        document.body.classList.remove('spring')
        document.body.classList.remove('christmas')
        document.body.classList.remove('dark')
        toggleTheme()
      {/** 봄 테마 사용 시
      } else if (localTheme === 'spring') {
          document.body.classList.remove('light')
          document.body.classList.remove('dark')
          document.body.classList.remove('christmas')
          document.body.classList.remove('frozen')
          document.body.classList.add('spring')
      */}
      } else if (localTheme === 'frozen') {
          document.body.classList.remove('light')
          document.body.classList.remove('dark')
          document.body.classList.remove('christmas')
          document.body.classList.remove('spring')
          document.body.classList.add('frozen')
      } else {
        document.body.classList.remove('dark')
        document.body.classList.remove('christmas')
        document.body.classList.remove('spring')
        document.body.classList.remove('frozen')
        document.body.classList.add('light')
      }
    }
  }, [theme, toggleTheme])

  useEffect(() => {
    const status = window.localStorage.getItem('touch_info') === null
    setTouchPrompt(status)
  }, [])

  {/** 테마 사용시 최초 Alert */}
  useEffect(() => {
    const status = window.localStorage.getItem('frozen_2025') === null
    setThemeAlert(status)
  }, [])

  useEffect(() => {
    if (themeAlert) {
      setModalTarget('Frozen')
      openModal()
      window.localStorage.setItem('frozen_2025', 'false')
    }
  }, [themeAlert])

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
                  //backgroundColor={}
                  pullingContent=""
                  refreshingContent={<Refreshing mode={theme} />}
                  resistance={3}
                  //className="transition-colors"
                >
                  <div
                    className={`${theme} h-full`}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <Apps>
                      <header>
                        <HeadlineWrapper>
                          <Title>
                            {t('title')}
                            <HelpIcon
                              aria-label="information icon"
                              onClick={handleModalTarget}
                              onContextMenu={handleContextMenu}
                              //draggable="false"
                              fill="var(--color-theme-text)"
                            ></HelpIcon>
                          </Title>
                        </HeadlineWrapper>
                        <NoticeWrapper>
                          <Suspense fallback={<div />}>
                            <Notice onModalOpen={handleNoticeModalOpen} />
                          </Suspense>
                        </NoticeWrapper>
                      </header>

                      <MainCardView className={getCardHeight()}>
                        {realtimeMode &&
                        (tab === 'subway' || tab === 'jungang') ? (
                          <>
                            <Suspense fallback={<div />}>
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
                          $realtimeMode={realtimeMode}
                          $touchPrompt={touchPrompt}
                          $tab={tab}
                        >
                          <SegmentedControl>
                            <ActiveIndicator
                              $activeIndex={realtimeMode ? 117 : 5}
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
                      <Transition in={routeCardClick} timeout={150}>
                        {(state) => (
                          <>
                            <RouteIndexCardView
                              status={state}
                              onClick={() => {
                                setRouteCardClick(!routeCardClick)
                              }}
                            >
                              <RouteIndexContainer status={state}>
                                <RouteIndexWrapper>
                                  <CycleCircle theme={theme} />
                                  <RouteText>{t('cycle_index')}</RouteText>
                                </RouteIndexWrapper>
                                <RouteIndexWrapper>
                                  <DirectCircle theme={theme} />
                                  <RouteText>{t('direct_index')}</RouteText>
                                </RouteIndexWrapper>
                                <RouteIndexWrapper>
                                  <YesulinCircle theme={theme} />
                                  <RouteText>{t('yesulin_index')}</RouteText>
                                </RouteIndexWrapper>
                                <RouteIndexWrapper>
                                  <JungangCircle theme={theme} />
                                  <RouteText>{t('jungang_index')}</RouteText>
                                </RouteIndexWrapper>
                              </RouteIndexContainer>
                              <RouteMap status={state} tab={tab} />
                              <RouteToggleImage
                                fill="var(--color-arrow-color)"
                                status={state}
                              />
                            </RouteIndexCardView>
                          </>
                        )}
                      </Transition>
                      <StationButtonWrapper>
                        <Button
                          id="shuttlecoke_o"
                          className={tab === 'shuttlecoke_o' ? 'active' : ''}
                          onClick={() => saveClicked('shuttlecoke_o')}
                        >
                          {t('shuttlecoke_o_btn')}
                        </Button>
                        <Button
                          id="subway"
                          className={tab === 'subway' ? 'active' : ''}
                          onClick={() => saveClicked('subway')}
                        >
                          {t('subway_btn')}
                        </Button>
                        <Button
                          id="yesulin"
                          className={tab === 'yesulin' ? 'active' : ''}
                          onClick={() => saveClicked('yesulin')}
                        >
                          {t('yesulin_btn')}
                        </Button>
                      </StationButtonWrapper>
                      <StationButtonWrapper>
                        <Button
                          id="jungang"
                          className={tab === 'jungang' ? 'active' : ''}
                          onClick={() => saveClicked('jungang')}
                        >
                          {t('jungang_btn')}
                        </Button>
                        <Button
                          id="shuttlecoke_i"
                          className={tab === 'shuttlecoke_i' ? 'active' : ''}
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
                          className={tab === 'residence' ? 'active' : ''}
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
                  </div>
                </PullToRefresh>
                <Suspense fallback={<div />}>
                  <ModalOpen
                    isModalAni={modalAni}
                    isOpen={modalOpen}
                    openModal={openModal}
                    closeModal={closeModal}
                    mTarget={modalTarget}
                    noticeContent={noticeContent}
                    noticeTitle={noticeTitle}
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
