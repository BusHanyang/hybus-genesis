import { useQuery } from '@tanstack/react-query'
import { classed } from '@tw-classed/react'
import { t, TFunction } from 'i18next'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SyncLoader } from 'react-spinners'

import { SingleTrainInfo, SubwayStop } from '@/data'
import { subwayAPI } from '@/network/subway'

const TimetableWrapper = classed('div', 'h-[14.8rem] hm:h-[15.3rem]')
const HeadlineWrapper = classed('div', 'flex justify-center hsm:mb-0')
const Headline = classed(
  'h2',
  'font-bold text-2xl mb-3 hsm:text-lg hm:text-[1.375rem] hsm:mb-4 hsm:mt-2 hm:mb-2 hm:mt-2',
)
const StnListWrapper = classed(
  'div',
  'flex my-3 gap-2 hsm:gap-2 leading-6 rounded-full items-center hover:brightness-90 hover:bg-slate-50 dark:hover:text-black p-[0.3rem] my-[0.3rem]',
  {
    variants: {
      'data-state': {
        departed:
          'text-[#ff3737] dark:bg-[#ffdede] dark:text-gray-800 font-bold items-center',
        arrived:
          'text-[#ff7433] dark:bg-[#ffe0ca] dark:text-gray-800 font-bold items-center',
        default: '',
      },
    },
    defaultVariants: {
      'data-state': 'default',
    },
  },
)
const Chip = classed('img', 'my-auto inline-block')
const DestStnLeftContainer = classed(
  'div',
  'flex justify-end items-center font-Ptd tabular-nums text-right w-[5.1rem] hm:text-[0.9rem] hsm:text-sm hsm:w-16',
  {
    variants: {
      'data-lang': {
        en: 'tracking-tighter',
        default: '',
      },
    },
    defaultVariants: {
      'data-lang': 'default',
    },
  },
)
const DestStnLeftWrapper = classed('div', {
  variants: {
    'data-length': {
      long: 'tracking-[-0.09em] text-sm hsm:text-xs',
      default: '',
    },
  },
  defaultVariants: {
    'data-length': 'default',
  },
})
const ArrivalStnStatusWrapper = classed(
  'span',
  'text-left inline-block hsm:text-sm hm:text-[0.9rem] pl-1 pr-2',
  {
    variants: {
      'data-lang': {
        en: 'tracking-tighter',
        default: '',
      },
    },
    defaultVariants: {
      'data-lang': 'default',
    },
  },
)
const SingleDirTimetableWrapper = classed('div', 'h-20')
const StatusWrapper = classed(
  'span',
  'font-Ptd tabular-nums inline-block px-1 w-20 text-right hm:text-[0.9rem] hm:w-16 hm:px-0 hsm:text-sm hsm:w-16',
)
const SubwayDivider = classed('hr', 'py-1 hsm:mb-4', {
  variants: {
    'data-state': {
      loading: 'hidden',
      idle: '',
    },
  },
  defaultVariants: {
    'data-state': 'idle',
  },
})
const TimetableLoadingContainer = classed('div', 'h-48')
const TitleLine4Icon = classed(
  Chip,
  'w-6 pb-2 hm:pb-0 hsm:pb-2 mr-[0.1rem]',
)
const TitleLineSUIcon = classed(
  Chip,
  'w-6 pb-2 hm:pb-0 hsm:pb-2 mr-1.5',
)
const TrainLineIcon = classed(Chip, 'mx-0.5 w-5')
const TrainTypeIcon = classed('img', 'h-4 ml-[0.15rem]')
const MainTimetable = classed('div', 'inline-block select-none h-full')
const NoTimetable = classed('div', 'h-full flex items-center justify-center')
const NoTimetableInner = classed(
  'span',
  'text-center hsm:text-sm table-cell align-middle',
)
const ApiErrorInner = classed(NoTimetableInner, 'mb-16')
const LoaderCell = classed('div', 'table-cell align-middle')
const ApiStatusButton = classed(
  'button',
  'rounded-md bg-gray-200 text-gray-700 cursor-default px-2 py-1 mt-2',
)

const arrivalUntil = (stnUntilArrival: number): string => {
  if (stnUntilArrival === 1) {
    return t('prevstn')
  } else if (stnUntilArrival === 0) {
    return t('here')
  } else {
    return stnUntilArrival + t('n_stn')
  }
}

const stationName = (arvlMsg3: string): string => {
  if (arvlMsg3 === '남동인더스파크') {
    return '남동공단'
  } else if (arvlMsg3 === '정부과천청사') {
    return '과천청사'
  } else if (arvlMsg3 === '총신대입구(이수)') {
    return '이수'
  } else if (arvlMsg3 === '동대문역사문화공원') {
    return '동역사'
  } else if (arvlMsg3 === '성신여대입구') {
    return '성신여대'
  } else if (arvlMsg3 === '대모산입구') {
    return '대모산'
  } else {
    return arvlMsg3
  }
}

const arrivalStnStatus = (
  status: number,
  orgStation: string,
  currentStation: string,
): string => {
  if (status === 1) {
    return t('entry')
  } else if (status === 2) {
    if (orgStation === currentStation) return t('waiting')
    else return t('arrival')
  } else if (status === 3) {
    return t('depart')
  } else {
    return t('operation')
  }
}

const titleText = (location: string): string => {
  if (location.trim() === '한대앞') {
    return t('hyu_stn')
  } else if (location.trim() === '중앙') {
    return t('jungang_stn')
  } else {
    return t('else')
  }
}

const getStationName = (bstatnNm: string) => {
  if (bstatnNm === '오이도') {
    return t('oido')
  } else if (bstatnNm === '안산') {
    return t('ansan')
  } else if (bstatnNm === '금정') {
    return t('geumjeong')
  } else if (bstatnNm === '사당') {
    return t('sadang')
  } else if (bstatnNm === '불암산') {
    return t('buramsan')
  } else if (bstatnNm === '노원') {
    return t('nowon')
  } else if (bstatnNm === '한성대입구') {
    return t('hansung')
  } else if (bstatnNm === '왕십리') {
    return t('wangsimni')
  } else if (bstatnNm === '청량리') {
    return t('cheongnyangni')
  } else if (bstatnNm === '인천') {
    return t('incheon')
  } else if (bstatnNm === '죽전') {
    return t('jukjeon')
  } else if (bstatnNm === '고색') {
    return t('gosaek')
  } else {
    return bstatnNm
  }
}

const getDestination = (
  destination: string,
  isLast: boolean,
  isExpress: boolean,
): string => {
  return getStationName(destination) + (!isLast && !isExpress ? t('for') : '')
}

const getRapidOrLastElement = (isLast: boolean, isExpress: boolean) => {
  if (isLast) {
    return (
      <TrainTypeIcon
        alt="last train icon"
        src={t('last_train_img')}
        draggable="false"
      />
    )
  } else if (isExpress) {
    return (
      <TrainTypeIcon
        alt="rapid train icon"
        src={t('rapid_train_img')}
        draggable="false"
      />
    )
  }
}

const getLineMarkElement = (line: string): React.JSX.Element => {
  if (line === '4') {
    return (
      <TrainLineIcon
        alt="line 4 icon"
        src="/image/line4.svg"
        draggable="false"
      />
    )
  } else if (line === 'SU') {
    return (
      <TrainLineIcon
        alt="line suin-bundang icon"
        src={`/image/${t('suin')}.svg`}
        draggable="false"
      />
    )
  } else
    return (
      <TrainLineIcon
        alt="unknown line icon"
        src="/image/helpblack.svg"
        draggable="false"
      />
    )
}

const openRailblue = (btrainNo: string): void => {
  const today = new Date()
  const year = today.getFullYear()
  const month = ('0' + (today.getMonth() + 1)).slice(-2)
  const day = ('0' + today.getDate()).slice(-2)
  const hours = ('0' + today.getHours()).slice(-2)

  const yesterday = new Date(today.setDate(today.getDate() - 1))
  const yYear = yesterday.getFullYear()
  const yMonth = ('0' + (yesterday.getMonth() + 1)).slice(-2)
  const yDay = ('0' + yesterday.getDate()).slice(-2)

  let date = year + month + day
  if (hours === '00' || hours === '01') {
    date = yYear + yMonth + yDay
  }
  window.open(
    'https://rail.blue/railroad/logis/Default.aspx?train=' +
      btrainNo +
      '&date=' +
      date +
      '#!',
    '_blank',
  )
}

const VALID_SOUTHBOUND_DESTINATIONS = ['안산', '오이도', '인천']

const Subway = ({ station }: SubwayStop) => {
  const timetable = useQuery({
    queryKey: ['subway_timetable', station],
    queryFn: async () => await subwayAPI(station),
    refetchInterval: 10000,
    staleTime: 5000,
  })
  const [isBlink, setBlink] = useState<boolean>(false)
  const { t, i18n } = useTranslation()

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setBlink((prev) => !prev)
    }, 3000)

    return () => window.clearTimeout(timeout)
  }, [isBlink])

  const openApiMonitor = () => {
    window.open(
      'https://monitor.hybus.app/status/bushanyang',
      '_blank',
      'noopener noreferrer',
    )
  }

  const compare = (a: SingleTrainInfo, b: SingleTrainInfo) => {
    const aNum = a.stnUntilArrival
    const bNum = b.stnUntilArrival

    const aStatus = a.status
    const bStatus = b.status

    if (aNum < bNum) return -1
    else if (aNum > bNum) return 1
    else {
      if (aStatus < bStatus) return 1
      else if (aStatus > bStatus) return -1
    }
    return 0
  }

  const getStationRowState = (
    prevDeparted: boolean,
    prevArrived: boolean,
  ) => {
    if (prevArrived) return 'arrived'
    if (prevDeparted) return 'departed'
    return 'default'
  }

  const renderTimetable = (
    direction: number,
    t: TFunction<['translation', ...string[]], undefined>,
  ) => {
    const filtered =
      timetable.data
        ?.filter(
          (val) =>
            val.direction === direction &&
            val.destination !== null &&
            (direction !== 2 ||
              VALID_SOUTHBOUND_DESTINATIONS.includes(val.destination)),
        )
        .sort(compare)
        .slice(0, 2) ?? []

    if (timetable.isPending) {
      return <></>
    }

    if (timetable.isError) {
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

    if (filtered.length === 0) {
      // Trains are done for today. User should refresh after midnight.
      return (
        <>
          <NoTimetable>
            <NoTimetableInner>
              {direction === 1 ? t('no_train_up') : t('no_train_down')}
            </NoTimetableInner>
          </NoTimetable>
        </>
      )
    }
    // Otherwise - normal case
    return (
      <>
        {filtered.map((val, idx) => {
          return (
            <React.Fragment key={idx}>
              <StnListWrapper
                data-state={getStationRowState(
                  val.destination === station.trim() ||
                    val.stnUntilArrival === 0,
                  val.stnUntilArrival === 1,
                )}
                onClick={() => openRailblue(val.trainCode)}
              >
                {getLineMarkElement(val.line)}
                <DestStnLeftContainer
                  data-lang={i18n.language === 'en' ? 'en' : 'default'}
                >
                  <DestStnLeftWrapper
                    data-length={
                      val.destination.includes('한성대') ||
                      (i18n.language === 'en' &&
                        val.destination.includes('청량리')) ||
                      (getRapidOrLastElement(val.isLast, val.isExpress) !==
                        undefined &&
                        i18n.language === 'en' &&
                        (val.destination.includes('왕십리') ||
                          val.destination.includes('불암산') ||
                          val.destination.includes('금정')))
                        ? 'long'
                        : 'default'
                    }
                  >
                    {getDestination(val.destination, val.isLast, val.isExpress)}
                  </DestStnLeftWrapper>
                  {getRapidOrLastElement(val.isLast, val.isExpress)}
                </DestStnLeftContainer>
                <StatusWrapper>
                  {isBlink
                    ? stationName(val.currentStation)
                    : arrivalUntil(val.stnUntilArrival)}
                </StatusWrapper>
                <ArrivalStnStatusWrapper
                  data-lang={i18n.language === 'en' ? 'en' : 'default'}
                >
                  {arrivalStnStatus(
                    val.status,
                    val.orgStation,
                    val.currentStation,
                  )}
                </ArrivalStnStatusWrapper>
              </StnListWrapper>
            </React.Fragment>
          )
        })}
      </>
    )
  }
  // Main Code for Implementation of DOM
  return (
    <TimetableWrapper>
      <HeadlineWrapper>
        <TitleLine4Icon src="/image/line4.svg" draggable="false" />
        <TitleLineSUIcon src={`/image/${t('suin')}.svg`} draggable="false" />
        <Headline>{titleText(station.trim())}</Headline>
      </HeadlineWrapper>
      <MainTimetable>
        {timetable.isPending ? (
          <TimetableLoadingContainer>
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
          </TimetableLoadingContainer>
        ) : (
          <></>
        )}
        {timetable.isError ? (
          <>
            <NoTimetable>
              <ApiErrorInner>
                {t('api_error')}
                <br />
                <ApiStatusButton onClick={openApiMonitor}>
                  {t('status_check')}
                </ApiStatusButton>
              </ApiErrorInner>
            </NoTimetable>
          </>
        ) : (
          <>
            <SingleDirTimetableWrapper>
              {renderTimetable(1, t)}
            </SingleDirTimetableWrapper>
            <SubwayDivider
              data-state={timetable.isPending ? 'loading' : 'idle'}
            />
            <SingleDirTimetableWrapper>
              {renderTimetable(2, t)}
            </SingleDirTimetableWrapper>
          </>
        )}
      </MainTimetable>
    </TimetableWrapper>
  )
}

export default Subway
