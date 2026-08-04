import { classed } from '@tw-classed/react'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { useDotAnimation } from '@/components/routemap/DotAnimation'
import RouteVisual from '@/components/routemap/RouteVisual'
import { useShuttleTimetable } from '@/components/shuttle/useShuttleTimetable'
import { StopLocation } from '@/data'

type TransitionStatus = 'entering' | 'entered' | 'exiting' | 'exited' | 'exit'

const RouteRowsContainer = classed('div', 'grid grid-rows-5 gap-2')
const RouteColsContainer = classed(
  'div',
  'relative grid grid-cols-6 place-items-center',
)
const RouteTextContainer = classed(
  'div',
  'whitespace-nowrap text-center tracking-tighter mt-1 hm:mt-2 hsm:mt-2 font-semibold',
  {
    variants: {
      lang: {
        ko: 'text-[15px] hm:text-[13px] hsm:text-[12px]',
        other:
          'wide:text-[13px] mwide:text-[12px] text-[11px] hm:text-[11px] hsm:text-[9.3px]',
      },
      'data-offset': {
        on: 'col-start-2',
        off: '',
      },
    },
    defaultVariants: {
      'data-offset': 'off',
    },
  },
)
const RouteMethod = classed(
  'div',
  'text-center rounded-full py-1 w-16 text-sm hm:w-12 hm:text-xs self-center text-black tracking-tight font-semibold',
  {
    variants: {
      tone: {
        direct: 'bg-chip-blue',
        cycle: 'bg-chip-red',
        yesulin: 'bg-chip-green',
        jungang: 'bg-chip-purple',
      },
    },
  },
)
const MainContainer = classed(
  'div',
  'transition duration-150 ease-in-out mx-auto h-56',
  {
    variants: {
      status: {
        entering: 'opacity-0',
        entered: 'opacity-100',
        exiting: 'opacity-0',
        exited: 'opacity-0',
        exit: 'opacity-100',
      },
    },
  },
)

const RouteMap = (props: { status: string; tab: string }) => {
  const { t, i18n } = useTranslation()
  const { routeTimetable } = useShuttleTimetable(props.tab as StopLocation)
  const animationFlagTable = useDotAnimation(props.tab, routeTimetable)

  return (
    <MainContainer status={props.status as TransitionStatus}>
      <RouteRowsContainer>
        <RouteColsContainer>
          <RouteTextContainer
            lang={i18n.language === 'ko' ? 'ko' : 'other'}
            data-offset="on"
          >
            {t('dorm')}
          </RouteTextContainer>
          <RouteTextContainer lang={i18n.language === 'ko' ? 'ko' : 'other'}>
            {t('dest_shuttle_o')}
          </RouteTextContainer>
          <RouteTextContainer lang={i18n.language === 'ko' ? 'ko' : 'other'}>
            {t('dest_subway')}
          </RouteTextContainer>
          <RouteTextContainer lang={i18n.language === 'ko' ? 'ko' : 'other'}>
            {t('dest_shuttle_o')}
          </RouteTextContainer>
          <RouteTextContainer lang={i18n.language === 'ko' ? 'ko' : 'other'}>
            {t('dorm')}
          </RouteTextContainer>
        </RouteColsContainer>
        <RouteColsContainer>
          <RouteMethod tone="direct">{t('direct')}</RouteMethod>
          <RouteVisual
            routeStatus="direct"
            tab={props.tab}
            animationFlagTable={animationFlagTable}
          />
        </RouteColsContainer>
        <RouteColsContainer>
          <RouteMethod tone="cycle">{t('cycle')}</RouteMethod>
          <RouteVisual
            routeStatus="cycle"
            tab={props.tab}
            animationFlagTable={animationFlagTable}
          />
        </RouteColsContainer>
        <RouteColsContainer>
          <RouteMethod tone="yesulin">{t('yesul')}</RouteMethod>
          <RouteVisual
            routeStatus="yesulin"
            tab={props.tab}
            animationFlagTable={animationFlagTable}
          />
        </RouteColsContainer>
        <RouteColsContainer>
          <RouteMethod tone="jungang">{t('jung')}</RouteMethod>
          <RouteVisual
            routeStatus="jungang"
            tab={props.tab}
            animationFlagTable={animationFlagTable}
          />
        </RouteColsContainer>
      </RouteRowsContainer>
    </MainContainer>
  )
}

export default RouteMap
