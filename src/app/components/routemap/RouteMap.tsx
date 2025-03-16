import React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import tw from 'twin.macro'

import RouteVisual from '@/components/routemap/RouteVisual'
const RouteRowsContainer = styled.div`
  ${tw`grid grid-rows-5 gap-2`}
`

const RouteColsContainer = styled.div`
  ${tw`relative grid grid-cols-6 place-items-center`}
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
  const { t, i18n } = useTranslation()

  return (
    <MainContainer status={props.status}>
      <RouteRowsContainer>
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
          <RouteVisual rootStatus="direct" tab={props.tab} />
        </RouteColsContainer>
        <RouteColsContainer>
          <RouteMethod className="bg-chip-red">{t('cycle')}</RouteMethod>
          <RouteVisual rootStatus="cycle" tab={props.tab} />
        </RouteColsContainer>
        <RouteColsContainer>
          <RouteMethod className="bg-chip-green">{t('yesul')}</RouteMethod>
          <RouteVisual rootStatus="yesulin" tab={props.tab} />
        </RouteColsContainer>
        <RouteColsContainer>
          <RouteMethod className="bg-chip-purple">{t('jung')}</RouteMethod>
          <RouteVisual rootStatus="jungang" tab={props.tab} />
        </RouteColsContainer>
      </RouteRowsContainer>
    </MainContainer>
  )
}

export default RouteMap
