import { useQuery } from '@tanstack/react-query'
import { classed } from '@tw-classed/react'
import { t, TFunction } from 'i18next'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SingleTrainInfo, SubwayStop } from '@/data'
import { subwayAPI } from '@/network/subway'

const HeadlineWrapper = classed(
  'div',
  'flex min-h-9 items-center justify-center gap-1.5 px-11 hm:px-10',
)
const Headline = classed(
  'h2',
  'm-0 text-[21px] font-extrabold tracking-[-0.02em] whitespace-pre hm:text-[19px] hsm:text-[17px]',
)
const TitleLineIcon = classed('img', 'w-6 drag-save-n')
const Body = classed('div', 'h-[185px] pt-2')
const DirectionGroup = classed('div', 'min-h-[84px] px-1.5 py-1', {
  variants: {
    'data-divider': {
      true: 'border-t border-control-main',
      false: '',
    },
  },
  defaultVariants: {
    'data-divider': 'false',
  },
})
// In dark mode a marked row sits on a light band, inset like the shuttle's
// departure flash so two marked rows never merge; pressing darkens the band.
const darkBand =
  'dark:border-y-[3px] dark:border-transparent dark:bg-clip-padding dark:text-gray-800 dark:active:brightness-90'
const TrainRow = classed(
  'button',
  'flex h-[38px] w-full items-center gap-2 rounded-[10px] px-1 text-left transition-[background-color,scale] duration-200 active:scale-[.985] active:bg-press-bg animate-rise',
  {
    variants: {
      // The original colors: red for a train at or ending at this station,
      // orange for one a stop away.
      'data-state': {
        here: `font-bold text-[#ff3737] dark:bg-[#ffdede] dark:active:bg-[#ffdede] ${darkBand}`,
        prev: `font-bold text-[#ff7433] dark:bg-[#ffe0ca] dark:active:bg-[#ffe0ca] ${darkBand}`,
        default: 'font-semibold',
      },
    },
    defaultVariants: {
      'data-state': 'default',
    },
  },
)
const TrainLineIcon = classed('img', 'h-[22px] w-[22px] shrink-0 drag-save-n')
const Destination = classed(
  'span',
  'flex min-w-0 items-center gap-1 text-base hsm:text-sm',
)
const DestinationText = classed('span', 'truncate', {
  variants: {
    // Long names get tighter type (as they did before) rather than an
    // ellipsis on narrow phones.
    'data-long': {
      true: 'text-sm tracking-[-0.06em] hsm:text-[13px]',
      false: '',
    },
  },
  defaultVariants: {
    'data-long': 'false',
  },
})
const TrainTypeIcon = classed('img', 'h-4 shrink-0 drag-save-n')
const Status = classed(
  'span',
  'ml-auto flex shrink-0 items-center gap-1.5 text-[15px] tabular-nums whitespace-nowrap hsm:text-[13px]',
)
const HotDot = classed(
  'span',
  'h-[7px] w-[7px] rounded-full bg-[#ff3737] animate-[hb-blink_1s_ease-in-out_infinite]',
)
const Empty = classed(
  'div',
  'flex h-[76px] items-center justify-center px-2 text-center text-[15px] font-semibold text-ink-2 hsm:text-sm',
)
const ErrorBox = classed(
  'div',
  'flex h-full flex-col items-center justify-center text-base font-semibold',
)
const ApiStatusButton = classed(
  'button',
  'mt-3 rounded-[10px] bg-press-bg px-3 py-2 text-sm font-semibold text-ink-2',
)
const StatusSwap = classed('span', 'animate-fade-in')
const ArrivalStatus = classed('span', '', {
  variants: {
    'data-state': {
      here: '',
      prev: '',
      default: 'text-ink-2',
    },
  },
  defaultVariants: {
    'data-state': 'default',
  },
})
const PaneBody = classed('div', 'px-3.5 pt-3')
const SkeletonRow = classed('div', 'flex h-[38px] items-center gap-2 px-1')
const SkeletonBadge = classed(
  'span',
  'hb-skeleton h-[22px] w-[22px] rounded-full',
)
const SkeletonBar = classed('span', 'hb-skeleton h-3.5', {
  variants: {
    'data-part': {
      destination: 'w-24',
      status: 'ml-auto w-20',
    },
  },
})

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

// The English names the original tightened; Korean names fit as they are.
const isLongDestination = (train: SingleTrainInfo, english: boolean) =>
  english &&
  (train.destination.includes('한성대') ||
    train.destination.includes('청량리') ||
    ((train.isLast || train.isExpress) &&
      ['왕십리', '불암산', '금정'].some((name) =>
        train.destination.includes(name),
      )))

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

  const getStationRowState = (train: SingleTrainInfo) => {
    if (train.stnUntilArrival === 1) return 'prev'
    if (train.destination === station.trim() || train.stnUntilArrival === 0)
      return 'here'
    return 'default'
  }

  const renderDirection = (
    direction: number,
    t: TFunction<['translation', ...string[]], undefined>,
  ) => {
    if (timetable.isPending) {
      return [0, 1].map((i) => (
        <SkeletonRow key={i}>
          <SkeletonBadge />
          <SkeletonBar data-part="destination" />
          <SkeletonBar data-part="status" />
        </SkeletonRow>
      ))
    }

    const filtered =
      timetable.data
        ?.filter(
          (val) => val.direction === direction && val.destination !== null,
        )
        .sort(compare)
        .slice(0, 2) ?? []

    if (filtered.length === 0) {
      // Trains are done for today. User should refresh after midnight.
      return (
        <Empty>{direction === 1 ? t('no_train_up') : t('no_train_down')}</Empty>
      )
    }

    return filtered.map((val, idx) => {
      const state = getStationRowState(val)

      return (
        <TrainRow
          key={val.trainCode || idx}
          type="button"
          data-state={state}
          style={{ animationDelay: `${((direction - 1) * 2 + idx) * 45}ms` }}
          onClick={() => openRailblue(val.trainCode)}
        >
          {getLineMarkElement(val.line)}
          <Destination>
            <DestinationText
              data-long={
                isLongDestination(val, i18n.language === 'en')
                  ? 'true'
                  : 'false'
              }
            >
              {getDestination(val.destination, val.isLast, val.isExpress)}
            </DestinationText>
            {getRapidOrLastElement(val.isLast, val.isExpress)}
          </Destination>
          <Status>
            {/* Only a train that is at this station now; one that merely ends
                here keeps the color but not the blink. */}
            {val.stnUntilArrival === 0 && <HotDot aria-hidden="true" />}
            <StatusSwap key={isBlink ? 'station' : 'count'}>
              {isBlink
                ? stationName(val.currentStation)
                : arrivalUntil(val.stnUntilArrival)}
            </StatusSwap>
            <ArrivalStatus data-state={state}>
              {arrivalStnStatus(val.status, val.orgStation, val.currentStation)}
            </ArrivalStatus>
          </Status>
        </TrainRow>
      )
    })
  }

  return (
    <PaneBody>
      <HeadlineWrapper>
        <TitleLineIcon src="/image/line4.svg" alt="" draggable="false" />
        <TitleLineIcon
          src={`/image/${t('suin')}.svg`}
          alt=""
          draggable="false"
        />
        <Headline>{titleText(station.trim())}</Headline>
      </HeadlineWrapper>
      <Body>
        {timetable.isError ? (
          <ErrorBox>
            {t('api_error')}
            <ApiStatusButton type="button" onClick={openApiMonitor}>
              {t('status_check')}
            </ApiStatusButton>
          </ErrorBox>
        ) : (
          <>
            <DirectionGroup>{renderDirection(1, t)}</DirectionGroup>
            <DirectionGroup data-divider="true">
              {renderDirection(2, t)}
            </DirectionGroup>
          </>
        )}
      </Body>
    </PaneBody>
  )
}

export default Subway
