import { classed } from '@tw-classed/react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import OpenImg from '/public/image/open_in_new_outline_24dp.svg?react'

type Platform = 'android' | 'ios'

const TIP_KEYS = ['info_tip_1', 'info_tip_2', 'info_tip_3', 'info_tip_4']
const STEP_KEYS: Record<Platform, Array<string>> = {
  android: ['info_android_1', 'info_android_2', 'info_android_3'],
  ios: ['info_ios_1', 'info_ios_2', 'info_ios_3'],
}

const Guide = classed('div', 'flex flex-col gap-5')
const Section = classed('div', '', {
  variants: {
    'data-order': {
      '1': 'animate-[hb-rise_.45s_cubic-bezier(.2,.8,.2,1)_.06s_backwards]',
      '2': 'animate-[hb-rise_.45s_cubic-bezier(.2,.8,.2,1)_.12s_backwards]',
      '3': 'animate-[hb-rise_.45s_cubic-bezier(.2,.8,.2,1)_.18s_backwards]',
      '4': 'animate-[hb-rise_.45s_cubic-bezier(.2,.8,.2,1)_.24s_backwards]',
    },
  },
})
const Intro = classed(Section, 'flex items-center gap-3.5')
const Mascot = classed(
  'img',
  'h-[66px] w-[60px] shrink-0 object-contain drag-save-n',
)
const IntroText = classed(
  'p',
  'm-0 text-[14.5px] leading-[1.6] text-ink-2 hsm:text-sm',
)
const SectionTitle = classed('h3', 'm-0 mb-2 text-sm font-extrabold')
const TipList = classed('ol', 'm-0 flex list-none flex-col gap-2 p-0')
const Tip = classed('li', 'flex items-start gap-3')
const TipNumber = classed(
  'span',
  'mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-button-active text-[12.5px] font-extrabold tabular-nums text-button-active-ink',
)
const TipText = classed('span', 'text-[14.5px] leading-[1.55] hsm:text-sm')
const PlatformControl = classed(
  'div',
  'relative mt-2.5 grid grid-cols-2 rounded-[14px] bg-control-main p-1 transition-colors duration-[350ms]',
)
const PlatformPill = classed(
  'div',
  'absolute left-1 top-1 h-[34px] w-[calc(50%-4px)] rounded-[10px] bg-theme-card shadow-[0_1px_3px_rgba(0,0,0,.1)] transition-transform duration-[400ms] ease-spring',
  {
    variants: {
      'data-platform': {
        android: 'translate-x-0',
        ios: 'translate-x-full',
      },
    },
  },
)
const PlatformButton = classed(
  'button',
  'relative h-[34px] text-[13.5px] font-bold',
)
const StepList = classed(
  'ol',
  'm-0 mt-3 flex list-none flex-col gap-2 p-0 animate-[hb-rise_.3s_cubic-bezier(.2,.8,.2,1)_backwards]',
)
const Step = classed(
  'li',
  'flex gap-2.5 text-[14.5px] leading-[1.55] hsm:text-sm',
)
const StepNumber = classed(
  'span',
  'shrink-0 font-extrabold tabular-nums text-ink-3',
)
const Hint = classed('p', 'm-0 mt-2.5 text-[13px] leading-normal text-ink-2')
const Links = classed(Section, 'flex flex-col gap-2')
const LinkRow = classed(
  'a',
  'flex min-h-[50px] items-center rounded-[14px] bg-press-bg px-3.5 text-[14.5px] font-bold transition-[background-color,scale] duration-150 active:scale-[.98]',
)
const LinkIcon = classed(OpenImg, 'ml-auto h-4 w-4 shrink-0 text-ink-3')

const InfoGuide = () => {
  const { t } = useTranslation()
  const [platform, setPlatform] = useState<Platform>('android')

  return (
    <Guide>
      <Intro data-order="1">
        <Mascot src="/image/hanyang_stop.png" alt="" draggable="false" />
        <IntroText>{t('info_intro')}</IntroText>
      </Intro>

      <Section data-order="2">
        <SectionTitle>{t('info_tips_title')}</SectionTitle>
        <TipList>
          {TIP_KEYS.map((key, i) => (
            <Tip key={key}>
              <TipNumber>{i + 1}</TipNumber>
              <TipText>{t(key)}</TipText>
            </Tip>
          ))}
        </TipList>
      </Section>

      <Section data-order="3">
        <SectionTitle>{t('info_install_title')}</SectionTitle>
        <PlatformControl>
          <PlatformPill aria-hidden="true" data-platform={platform} />
          <PlatformButton
            type="button"
            aria-pressed={platform === 'android'}
            onClick={() => setPlatform('android')}
          >
            {t('info_android')}
          </PlatformButton>
          <PlatformButton
            type="button"
            aria-pressed={platform === 'ios'}
            onClick={() => setPlatform('ios')}
          >
            {t('info_ios')}
          </PlatformButton>
        </PlatformControl>
        <StepList key={platform}>
          {STEP_KEYS[platform].map((key, i) => (
            <Step key={key}>
              <StepNumber>{i + 1}.</StepNumber>
              <span>{t(key)}</span>
            </Step>
          ))}
        </StepList>
        <Hint>{t('info_install_hint')}</Hint>
      </Section>

      <Links data-order="4">
        <LinkRow
          href="https://ios-widget.hybus.app"
          target="_blank"
          rel="noreferrer"
        >
          {t('info_widget_link')}
          <LinkIcon aria-hidden="true" />
        </LinkRow>
        <LinkRow href={t('info_link')} target="_blank" rel="noreferrer">
          {t('info_route_link')}
          <LinkIcon aria-hidden="true" />
        </LinkRow>
      </Links>
    </Guide>
  )
}

export default InfoGuide
