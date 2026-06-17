import { useQuery } from '@tanstack/react-query'
import { classed } from '@tw-classed/react'
import { t } from 'i18next'
import React from 'react'
import { Trans } from 'react-i18next'

import { SEASONAL_THEME_ENABLED_STORAGE_KEY } from '@/context/ThemeContext'
import { changelogAPI } from '@/network/changelog'

import { Modal } from './modal'

const P = classed('p', 'my-[0.2em]')
const ChangelogMargin = classed('div', 'mb-[1em]')
const ContentArea = classed('div', 'm-auto justify-between')
const ChangelogDiv = classed(ContentArea, 'text-left')
const ModalButton = classed('button', 'outline-hidden cursor-pointer border-0')
const ModalFooterButton = classed(
  ModalButton,
  'mt-6 py-6 w-full text-white bg-indigo-400 font-Ptd font-bold text-lg rounded-md',
)
const ModalScrollArea = classed('div', 'font-Ptd overflow-auto max-h-[450px]')

const ModalOpen = (props: {
  isOpen: boolean
  isModalAni: boolean
  openModal: () => void
  closeModal: () => void
  mTarget: string
  noticeContent?: string
  noticeTitle?: string
}) => {
  const changelogs = useQuery({
    queryKey: ['changelog'],
    queryFn: changelogAPI,
    staleTime: 5 * 60 * 1000,
  })

  const toggleTheme = (themeName: string) => {
    window.localStorage.setItem(SEASONAL_THEME_ENABLED_STORAGE_KEY, 'true')
    window.localStorage.setItem('theme', themeName)
    window.location.reload()
  }

  return (
    <React.Fragment>
      <Modal
        open={props.isOpen}
        ani={props.isModalAni}
        close={props.closeModal}
        mTarget={props.mTarget}
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
              {props.mTarget === 'Christmas' && (
                <>
                  <Trans i18nKey="christmas_txt" />
                  <br />

                  <ModalFooterButton onClick={() => toggleTheme('christmas')}>
                    {t('christmas_btn')}
                  </ModalFooterButton>
                </>
              )}
              {props.mTarget === 'Spring' && (
                <>
                  <Trans i18nKey="spring_txt" />
                  <br />

                  <ModalFooterButton onClick={() => toggleTheme('spring')}>
                    {t('spring_btn')}
                  </ModalFooterButton>
                </>
              )}
              {props.mTarget === 'Frozen' && (
                <>
                  <Trans i18nKey="frozen_txt" />
                  <br />

                  <ModalFooterButton onClick={() => toggleTheme('winter')}>
                    {t('frozen_btn')}
                  </ModalFooterButton>
                </>
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
