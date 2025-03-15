import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import tw from 'twin.macro'

import Animation from '@/components/routemap/Animation'
import Responsive from '@/components/routemap/Responsive'
import { DotRoute, LineRoute } from '@/components/routemap/RouteVisual'
import { useTimeTableContext } from '@/context/TimeTableContext'
import { SingleShuttleSchedule } from '@/data'

const RouteRowsContainer = styled.div`
  ${tw`grid grid-rows-5 gap-2`}
`

const RouteColsContainer = styled.div`
  ${tw`grid grid-cols-6 place-items-center`}
`

const RouteTextContainer = styled.div<{ lang: string }>`
  ${tw`whitespace-nowrap text-center tracking-tighter mt-1 hm:mt-2 hsm:mt-2 font-semibold`}
  ${(props) =>
    props.lang === 'ko'
      ? tw`text-[15px] hm:text-[13px] hsm:text-[12px]`
      : tw`wide:text-[13px] mwide:text-[12px] text-[11px] hm:text-[11px] hsm:text-[9.3px]`}
`

const RouteMethod = styled.div`
  ${tw`text-center rounded-full py-1 w-16 text-sm hm:w-12 hm:text-xs self-center text-black tracking-tight font-semibold`}
`

const MainContainer = styled.div<{ status: string }>`
  ${tw`transition duration-150 ease-in-out mx-auto h-[14rem]`}
  ${(props) =>
    props.status === 'entered' || props.status === 'exit'
      ? tw`opacity-100`
      : tw`opacity-0`}
`

const RouteMap = (props: { status: string; tab: string }) => {
  const timetable = useTimeTableContext().timetable
  const timeCheck = useRef<SingleShuttleSchedule>({ time: '', type: 'NA' })

  const { t, i18n } = useTranslation()
  // main ref
  const mainRef = useRef<HTMLDivElement>(null)
  // dot nodes
  const dotDir = useRef<NodeListOf<HTMLDivElement>>()
  const dotCyc = useRef<NodeListOf<HTMLDivElement>>()
  const dotYes = useRef<NodeListOf<HTMLDivElement>>()
  const dotJun = useRef<NodeListOf<HTMLDivElement>>()
  // line nodes
  const lineDir = useRef<NodeListOf<HTMLDivElement>>()
  const lineCyc = useRef<NodeListOf<HTMLDivElement>>()
  const lineYes = useRef<NodeListOf<HTMLDivElement>>()
  const lineJun = useRef<NodeListOf<HTMLDivElement>>()

  const isPrevStop = (line: string, index: number) => {
    switch (props.tab) {
      case 'shuttlecoke_o':
        return index !== 0
      case 'shuttlecoke_i':
        if (line === 'direct') return index >= 3
        return index >= 4
      case 'subway':
        if (line === 'yesulin') return false
        return index >= 2
      case 'yesulin':
        if (line === 'direct' || line === 'jungang') return false
        return index >= 3
      case 'jungang':
        if (line === 'jungang') return index >= 3
        return false
      default:
        return true
    }
  }

  useEffect(() => {
    // dot
    dotDir.current = mainRef.current?.querySelectorAll('#dirdot')
    dotCyc.current = mainRef.current?.querySelectorAll('#cycdot')
    dotYes.current = mainRef.current?.querySelectorAll('#yesdot')
    dotJun.current = mainRef.current?.querySelectorAll('#jundot')
    // line
    lineDir.current = mainRef.current?.querySelectorAll('#dirline')
    lineCyc.current = mainRef.current?.querySelectorAll('#cycline')
    lineYes.current = mainRef.current?.querySelectorAll('#yesline')
    lineJun.current = mainRef.current?.querySelectorAll('#junline')

    Responsive(
      [dotDir, dotCyc, dotYes, dotJun],
      [lineDir, lineCyc, lineYes, lineJun],
    )
  }, [])

  useEffect(() => {
    Animation(
      { dotDir: dotDir, dotCyc: dotCyc, dotJun: dotJun, dotYes: dotYes },
      props.tab,
      timeCheck,
      timetable,
    )
  }, [timetable, props.tab])

  return (
    <MainContainer status={props.status}>
      <RouteRowsContainer ref={mainRef}>
        <RouteColsContainer>
          <RouteTextContainer lang={i18n.language} className="col-start-2">
            {t('dorm')}
          </RouteTextContainer>
          <RouteTextContainer lang={i18n.language}>
            {t('dest_shuttle_o')}
          </RouteTextContainer>
          <RouteTextContainer lang={i18n.language}>
            {t('dest_subway')}
          </RouteTextContainer>
          <RouteTextContainer lang={i18n.language}>
            {t('dest_shuttle_o')}
          </RouteTextContainer>
          <RouteTextContainer lang={i18n.language}>
            {t('dorm')}
          </RouteTextContainer>
        </RouteColsContainer>
        <RouteColsContainer>
          <RouteMethod className="bg-chip-blue">{t('direct')}</RouteMethod>
          <DotRoute rootStatus="direct" isPrevStop={isPrevStop} />
          <LineRoute rootStatus="direct" isPrevStop={isPrevStop} />
        </RouteColsContainer>
        <RouteColsContainer>
          <RouteMethod className="bg-chip-red">{t('cycle')}</RouteMethod>
          <DotRoute rootStatus="cycle" isPrevStop={isPrevStop} />
          <LineRoute rootStatus="cycle" isPrevStop={isPrevStop} />
        </RouteColsContainer>
        <RouteColsContainer>
          <RouteMethod className="bg-chip-green">{t('yesul')}</RouteMethod>
          <DotRoute rootStatus="yesulin" isPrevStop={isPrevStop} />
          <LineRoute rootStatus="yesulin" isPrevStop={isPrevStop} />
        </RouteColsContainer>
        <RouteColsContainer>
          <RouteMethod className="bg-chip-purple">{t('jung')}</RouteMethod>
          <DotRoute rootStatus="jungang" isPrevStop={isPrevStop} />
          <LineRoute rootStatus="jungang" isPrevStop={isPrevStop} />
        </RouteColsContainer>
      </RouteRowsContainer>
    </MainContainer>
  )
}

export default RouteMap
