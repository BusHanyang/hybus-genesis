import { useQuery } from '@tanstack/react-query'
import { classed } from '@tw-classed/react'
import { t } from 'i18next'
import React from 'react'

import { changelogAPI } from '@/network/changelog'

import { Modal } from './modal'

const P = classed('p', 'my-[0.2em]')
const ChangelogMargin = classed('div', 'mb-[1em]')
const ContentArea = classed('div', 'm-auto justify-between')
const ChangelogDiv = classed(ContentArea, 'text-left')
const ModalButton = classed('button', 'outline-hidden cursor-pointer border-0')
const ModalScrollArea = classed('div', 'font-Ptd overflow-auto max-h-[450px]')
const SeasonalPrompt = classed('div')
const SeasonalPromptText = classed(
  'p',
  'text-sm leading-6 opacity-90 hsm:text-[13px] hsm:leading-5',
)
const SeasonalPromptHint = classed(
  'p',
  'mt-4 text-sm leading-6 opacity-80 hsm:text-[13px] hsm:leading-5',
)
const SeasonalPromptPrimaryButton = classed(
  ModalButton,
  'mt-6 w-full rounded-md bg-indigo-400 px-4 py-6 font-Ptd text-lg font-bold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 hsm:py-5 hsm:text-base',
)
const SeasonalPromptSecondaryButton = classed(
  ModalButton,
  'rounded-md bg-gray-500 px-4 py-2 font-Ptd text-xs text-white transition-colors hover:bg-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 hsm:min-h-11',
)

const ModalOpen = (props: {
  isOpen: boolean
  isModalAni: boolean
  closeModal: () => void
  mTarget: string
  noticeContent?: string
  noticeTitle?: string
  onEnableSeasonalTheme: () => void
}) => {
  const changelogs = useQuery({
    queryKey: ['changelog'],
    queryFn: changelogAPI,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <React.Fragment>
      <Modal
        open={props.isOpen}
        ani={props.isModalAni}
        close={props.closeModal}
        mTarget={props.mTarget}
        seasonalFooter={
          props.mTarget === 'Seasonal' ? (
            <SeasonalPromptSecondaryButton
              type="button"
              onClick={props.closeModal}
            >
              {t('seasonal_prompt_keep')}
            </SeasonalPromptSecondaryButton>
          ) : undefined
        }
      >
        <ModalScrollArea>
          <ContentArea>
            <ChangelogDiv>
              {props.mTarget === 'Fabs' &&
                (changelogs.data?.map(
                  (datum: { date: string; details: Array<string> }) => {
                    const arr: string[] = datum.details
                    return (
                      <ChangelogMargin key={datum.date}>
                        <h4>{datum.date}</h4>
                        {arr.map((item) => (
                          <P key={item}>{item}</P>
                        ))}
                      </ChangelogMargin>
                    )
                  },
                ) ?? <></>)}
              {props.mTarget === 'Info' && (
                <iframe
                  title="information-iframe"
                  width="100%"
                  height="450"
                  src={t('info_link')}
                ></iframe>
              )}
              {props.mTarget === 'Seasonal' && (
                <SeasonalPrompt>
                  <SeasonalPromptText>
                    {t('seasonal_prompt_text')}
                  </SeasonalPromptText>
                  <SeasonalPromptHint>
                    {t('seasonal_prompt_once')}
                  </SeasonalPromptHint>
                  <SeasonalPromptPrimaryButton
                    type="button"
                    onClick={props.onEnableSeasonalTheme}
                  >
                    {t('seasonal_prompt_enable')}
                  </SeasonalPromptPrimaryButton>
                </SeasonalPrompt>
              )}
              {props.mTarget === 'Notice' && (
                <>
                  {props.noticeTitle && (
                    <h3 className="font-bold text-lg mb-3">
                      {props.noticeTitle}
                    </h3>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {props.noticeContent || ''}
                  </div>
                </>
              )}
            </ChangelogDiv>
          </ContentArea>
        </ModalScrollArea>
      </Modal>
    </React.Fragment>
  )
}

export default ModalOpen
