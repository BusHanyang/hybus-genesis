import { classed } from '@tw-classed/react'
import { t } from 'i18next'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SyncLoader } from 'react-spinners'

import MapImg from '/public/image/map_black_24dp.svg?react'
import { openNaverMapApp } from '@/components/shuttle/map'
import {
  convertUnixToTime,
  useShuttleTimetable,
} from '@/components/shuttle/useShuttleTimetable'
import { ChipType, ShuttleStop } from '@/data'
import { seasonKeys } from '@/data/shuttle/season'
import { weekKeys } from '@/data/shuttle/week'

const TimetableWrapper = classed('div', 'h-[14.8rem]')
const HeadlineWrapper = classed('div', 'relative drag-save-n')
const Headline = classed(
  'h2',
  'font-bold text-2xl mb-2 hsm:text-lg hsm:mb-4 hsm:mt-2 hm:text-[1.375rem] hm:mb-4 hm:mt-2',
)
const MainTimeTableWrapper = classed(
  'div',
  'w-full h-45 inline-block touch-none',
)
const MainTimetable = classed('div', 'inline-block select-none h-full')
const Chip = classed(
  'div',
  'text-black py-1 w-12 rounded-full inline-block text-center hsm:text-sm hsm:leading-4 hsm:w-10 hm:w-10 hm:text-[0.9rem] tracking-tighter',
  {
    variants: {
      'data-tone': {
        cycle: 'bg-chip-red',
        jungang: 'bg-chip-purple',
        yesulin: 'bg-chip-green',
        orange: 'bg-chip-orange',
        direct: 'bg-chip-blue',
      },
    },
  },
)
const SingleTimetable = classed('div', 'text-left mx-auto py-1.5')
const OnTouchAvailableWrapper = classed(
  'div',
  'bg-ontouch-bg rounded-md text-center h-8 w-70 hm:w-65 hsm:w-[14.85rem] mt-1 mx-auto p-1.5 leading-5 overflow-hidden',
  {
    variants: {
      'data-state': {
        hidden: 'hidden',
        visible: '',
      },
    },
    defaultVariants: {
      'data-state': 'visible',
    },
  },
)
const OnTouchCloseWrapper = classed(
  'div',
  'w-fit float-right ml-1 h-full flex hsm:ml-0',
)
const TimeLeftWrapper = classed(
  'span',
  'font-Ptd tabular-nums inline-block px-1 w-32 text-right hsm:text-sm hsm:w-26 hm:text-[0.9rem] hm:w-28 hm:px-0 hm:leading-6',
  {
    variants: {
      'data-state': {
        touched: 'font-bold text-[#ff673d] dark:text-[#ff996a]',
        default: '',
      },
    },
    defaultVariants: {
      'data-state': 'default',
    },
  },
)
const ArrowWrapper = classed(
  'div',
  'text-center inline-block w-6 mx-1.5 hsm:w-4 hsm:text-sm hsm:mx-[0.040rem] hm:mx-0.5 hm:text-[0.9rem] hm:w-6 hm:leading-6',
)
const DestinationWrapper = classed(
  'span',
  'text-left inline-block hsm:text-sm hm:text-[0.9rem] hm:leading-6',
)
const NoTimetable = classed('div', 'h-full table')
const NoTimetableInner = classed('span', 'table-cell align-middle leading-6')
const LoaderCell = classed('div', 'table-cell align-middle')
const TimeClickableConversionText = classed('span', 'transition duration-300')
const TimeClickableNotifyText = classed(
  'div',
  'transition-transform float-left my-auto hsm:text-[0.8rem] hm:text-[0.875rem]',
)
const ApiStatusButton = classed(
  'button',
  'rounded-md bg-gray-200 text-gray-700 cursor-default px-2 py-1 mt-2',
)
const MapButton = classed('button', 'absolute top-0 right-0 h-full drag-save-n')
const MapIcon = classed(
  MapImg,
  'cursor-default h-8 w-8 hsm:h-7 hsm:w-7 drag-save-n',
)
const CloseIcon = classed('img', 'cursor-default dark:invert h-4 w-4 my-auto')

const secondToTimeFormat = (n: number): string => {
  const seconds = n % 60
  let minutes = Math.floor(n / 60)
  const hours = Math.floor(minutes / 60)

  if (minutes >= 60) {
    minutes = minutes % 60
  }

  let formattedMin = `${minutes}`
  let formattedSec = `${seconds}`
  let formattedHour = `${hours}`

  if (hours < 10) {
    formattedHour = `0${hours}`
  }

  if (minutes < 10) {
    formattedMin = `0${minutes}`
  }

  if (seconds < 10) {
    formattedSec = `0${seconds}`
  }

  if (hours === 0) {
    return `${formattedMin}:${formattedSec}`
  } else {
    return `${formattedHour}:${formattedMin}:${formattedSec}`
  }
}

const busTypeToText = (busType: string): string => {
  if (busType == 'C') {
    return t('cycle')
  } else if (busType == 'NA') {
    return t('NA')
  } else {
    return t('direct')
  }
}

const getBusDestination = (busType: string, currentLoc: string): string => {
  if (currentLoc == 'shuttlecoke_o') {
    if (busType == 'C' || busType == 'DH' || busType == 'DHJ') {
      return t('dest_subway')
    } else if (busType == 'DY') {
      return t('dest_yesul')
    } else {
      return t('loading')
    }
  } else if (currentLoc == 'subway') {
    if (busType == 'C') {
      return t('dest_yesul')
    } else if (busType == 'DHJ') {
      return t('dest_jungang')
    } else {
      return t('dest_shuttle_i')
    }
  } else if (currentLoc == 'yesulin') {
    return t('dest_shuttle_i')
  } else if (currentLoc == 'jungang') {
    return t('dest_shuttle_i')
  } else if (currentLoc == 'shuttlecoke_i') {
    if (busType == 'NA') {
      return t('no_dest')
    } else if (busType == 'R') {
      return t('dest_dorm')
    } else {
      return t('loading')
    }
  } else if (currentLoc == 'residence') {
    return t('dest_shuttle_o')
  } else {
    return t('loading')
  }
}

const titleText = (location: string): string => {
  if (location == 'shuttlecoke_o') {
    return t('shuttlecoke_o')
  } else if (location == 'subway') {
    return t('subway')
  } else if (location == 'jungang') {
    return t('jungang')
  } else if (location == 'yesulin') {
    return t('yesulin')
  } else if (location == 'shuttlecoke_i') {
    return t('shuttlecoke_i')
  } else if (location == 'residence') {
    return t('residence')
  } else {
    return t('else')
  }
}

const ColoredChip = ({ chipType }: ChipType) => {
  if (chipType == 'C') {
    return <Chip data-tone="cycle">{busTypeToText(chipType)}</Chip>
  } else if (chipType == 'DHJ') {
    return <Chip data-tone="jungang">{busTypeToText(chipType)}</Chip>
  } else if (chipType == 'DY') {
    return <Chip data-tone="yesulin">{busTypeToText(chipType)}</Chip>
  } else if (chipType == 'R' || chipType == 'NA') {
    return <Chip data-tone="orange">{busTypeToText(chipType)}</Chip>
  }

  return <Chip data-tone="direct">{busTypeToText(chipType)}</Chip>
}

export const Shuttle = ({ location }: ShuttleStop) => {
  const { currentTime, season, timetable, upcomingTimetable, week } =
    useShuttleTimetable(location)
  const [touched, setTouched] = useState<boolean>(false)
  const [infoClosed, setInfoClosed] = useState<boolean>(
    window.localStorage.getItem('touch_info') === 'closed',
  )
  const [timetableAlive, setTimetableAlive] = useState<boolean>(true)

  // For info card to not show when error or no shuttle available
  useEffect(() => {
    if (
      timetable.data?.length === 0 ||
      timetable.status !== 'success' ||
      upcomingTimetable.length === 0
    ) {
      setTimetableAlive(false)
    } else {
      setTimetableAlive(true)
    }
  }, [timetable.data?.length, timetable.status, upcomingTimetable.length])

  // Set week and season to localStorage
  useEffect(() => {
    if (season !== null && season !== seasonKeys.HALT) {
      window.localStorage.setItem('season', season)
    }

    if (week !== null && week !== weekKeys.UNKNOWN) {
      window.localStorage.setItem('week', week)
    }

    if (window.localStorage.getItem('season') === seasonKeys.HALT) {
      window.localStorage.setItem('season', seasonKeys.SEMESTER)
    }

    if (window.localStorage.getItem('week') === weekKeys.UNKNOWN) {
      window.localStorage.setItem('week', weekKeys.WEEK)
    }
  }, [season, week])

  const handleActionStart = () => {
    setTouched(true)
  }

  const handleActionEnd = () => {
    setTouched(false)
  }

  const handleContextMenu = (
    e: React.MouseEvent<SVGSVGElement, MouseEvent>,
  ) => {
    e.preventDefault()
  }

  const openApiMonitor = () => {
    window.open(
      'https://monitor.hybus.app/status/bushanyang',
      '_black',
      'noopener noreferrer',
    )
  }

  const RenderTimetable = (showActualTime: boolean): React.JSX.Element => {
    const { t } = useTranslation()

    if (timetable.data === undefined) {
      return <></>
    }

    if (timetable.isPending) {
      return <></>
    }

    if (timetable.status === 'error') {
      // Timetable API error
      return (
        <>
          <NoTimetable>
            <NoTimetableInner>
              {t('api_error')}
              <br />
              <ApiStatusButton onClick={openApiMonitor}>
                {t('status_check')}
              </ApiStatusButton>
            </NoTimetableInner>
          </NoTimetable>
        </>
      )
    }

    if (timetable.data.length === 0) {
      // Timetable doesn't exist
      return (
        <>
          <NoTimetable>
            <NoTimetableInner>{t('no_today')}</NoTimetableInner>
          </NoTimetable>
        </>
      )
    }

    const filtered = upcomingTimetable
    const reverted = filtered.map((val) => convertUnixToTime(val))

    if (filtered.length === 0) {
      // Buses are done for today. User should refresh after midnight.
      return (
        <>
          <NoTimetable>
            <NoTimetableInner>{t('end_today')}</NoTimetableInner>
          </NoTimetable>
        </>
      )
    }

    // Otherwise - normal case
    return (
      <>
        {filtered.map((val, idx) => {
          if (idx < 5) {
            return (
              <React.Fragment key={idx}>
                <SingleTimetable>
                  <ColoredChip chipType={val.type} />
                  <TimeLeftWrapper
                    data-state={showActualTime ? 'touched' : 'default'}
                  >
                    {showActualTime ? (
                      <TimeClickableConversionText>
                        {reverted[idx].time.split(':')[0] +
                          t('hour') +
                          reverted[idx].time.split(':')[1] +
                          t('minute') +
                          ' ' +
                          t('departure')}
                      </TimeClickableConversionText>
                    ) : (
                      <TimeClickableConversionText>
                        {secondToTimeFormat(
                          Math.floor(
                            Number(val.time) - Number(currentTime) / 1000,
                          ),
                        ) +
                          ' ' +
                          t('left')}
                      </TimeClickableConversionText>
                    )}
                  </TimeLeftWrapper>
                  <ArrowWrapper>▶</ArrowWrapper>
                  <DestinationWrapper>
                    {getBusDestination(val.type, location)}
                  </DestinationWrapper>
                </SingleTimetable>
              </React.Fragment>
            )
          } else {
            return <React.Fragment key={idx} />
          }
        })}
      </>
    )
  }

  return (
    <TimetableWrapper>
      <HeadlineWrapper>
        <Headline>{titleText(location)}</Headline>
        <MapButton
          onClick={() => {
            openNaverMapApp(location)
          }}
        >
          <MapIcon
            aria-label="map icon"
            fill="var(--color-theme-text)"
            onContextMenu={handleContextMenu}
            //draggable="false"
          />
        </MapButton>
      </HeadlineWrapper>
      <MainTimeTableWrapper
        onTouchStart={handleActionStart}
        onTouchEnd={handleActionEnd}
        onMouseDown={handleActionStart}
        onMouseUp={handleActionEnd}
      >
        <MainTimetable>
          {timetable.isPending ? (
            <NoTimetable>
              <LoaderCell>
                <SyncLoader
                  color="var(--color-load-color)"
                  margin={4}
                  size={8}
                  loading={timetable.isPending}
                />
              </LoaderCell>
            </NoTimetable>
          ) : (
            <></>
          )}
          {RenderTimetable(touched)}
        </MainTimetable>
      </MainTimeTableWrapper>
      <OnTouchAvailableWrapper
        data-state={
          timetable.isPending || infoClosed || !timetableAlive
            ? 'hidden'
            : 'visible'
        }
      >
        {touched ? (
          <TimeClickableNotifyText>
            <>{t('now_actual_time')}</>
          </TimeClickableNotifyText>
        ) : (
          <TimeClickableNotifyText>
            <>{t('check_on_touch')}</>
          </TimeClickableNotifyText>
        )}
        <OnTouchCloseWrapper>
          <CloseIcon
            src={'../image/close_black_24dp.svg'}
            alt="close icon"
            onClick={() => {
              setInfoClosed(true)
              window.localStorage.setItem('touch_info', 'closed')
              window.location.reload()
            }}
          />
        </OnTouchCloseWrapper>
      </OnTouchAvailableWrapper>
    </TimetableWrapper>
  )
}
