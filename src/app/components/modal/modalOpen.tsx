import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import React from 'react'
import { Trans } from 'react-i18next'
import styled from 'styled-components'
import tw from 'twin.macro'

import { changelogAPI } from '@/network/changelog'

import { Modal } from './modal'

const P = styled.p`
  ${tw`my-[0.2em]`}
`
const ChangelogMargin = styled.div`
  ${tw`mb-[1em]`}
`
const ContentArea = styled.div`
  ${tw`m-auto justify-between`}
`
const ChangelogDiv = styled(ContentArea)`
  ${tw`text-left`}
`
const ModalButton = styled.button`
  ${tw`outline-none cursor-pointer border-0`}
`
const ModalFooterButton = styled(ModalButton)`
  ${tw`mt-6 py-6 w-full text-white bg-rose-400 font-Ptd font-bold text-lg rounded-md`}
`

const ModalOpen = (props: {
  isOpen: boolean
  isModalAni: boolean
  openModal: () => void
  closeModal: () => void
  mTarget: string
}) => {
  const changelogs = useQuery({
    queryKey: ['changelog'],
    queryFn: changelogAPI,
    staleTime: 5 * 60 * 1000,
  })

  const toggleTheme = () => {
    window.localStorage.setItem('theme', 'christmas')
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
        <div
          className="font-Ptd"
          style={{ overflow: 'auto', maxHeight: '450px' }}
        >
          <ContentArea>
            <ChangelogDiv>
              {props.mTarget === 'Fabs' && (
                changelogs.data?.map(
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
                ) ?? <></>
              )}
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
                  <Trans
                    i18nKey='christmas_txt'
                  />
                  <br/>
                
                  <ModalFooterButton onClick={toggleTheme}>
                    {t('christmas_btn')}
                  </ModalFooterButton>
                </>
              )}
            </ChangelogDiv>
          </ContentArea>
        </div>
      </Modal>
    </React.Fragment>
  )
}

export default ModalOpen
