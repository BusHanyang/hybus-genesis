import axios from 'axios'
import { t } from 'i18next'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import tw from 'twin.macro'

import { Modal } from './modal'

type Changelog = {
  date: string
  details: Array<string>
}

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

const ModalOpen = (props: {
  isOpen: boolean
  isModalAni: boolean
  openModal: () => void
  closeModal: () => void
  mTarget: string
}) => {
  const [data, setData] = useState<Array<Changelog>>([])
  const [isLoaded, setLoaded] = useState<boolean>(false)
  const url = 'https://api.hybus.app/changelog/'

  const getChangelog = async (): Promise<Array<Changelog>> => {
    return await axios
      .get(url)
      .then((response) => {
        return response.data
      })
      .catch((error) => {
        console.log(`error ${error}`)
        return new Array<Changelog>
      })
      .then((response) => response as unknown as Array<Changelog>)
  }

  useEffect(() => {
    if (!isLoaded) {
      getChangelog().then((response) => {
        setData(response)
        setLoaded(true)
      })
    }
  }, [isLoaded])

  return (
    <React.Fragment>
      <Modal open={props.isOpen} ani={props.isModalAni} close={props.closeModal} mTarget={props.mTarget}>
        <div
          className='font-Ptd'
          style={{ overflow: 'auto', maxHeight: '450px' }}
        >
          <ContentArea>
            <ChangelogDiv>
              {props.mTarget === "Fabs" ? data.map((datum: { date: string; details: Array<string> }) => {
                const arr: string[] = datum.details
                return (
                  <ChangelogMargin key={datum.date}>
                    <h4>{datum.date}</h4>
                    {arr.map((item) => (
                      <P key={item}>{item}</P>
                    ))}
                  </ChangelogMargin>
                )
              }) : 
                <iframe
                title="information-iframe"
                width="100%"
                height="450"
                src={t('info_link')}>
                </iframe>
              }
            </ChangelogDiv>
          </ContentArea>
        </div>
      </Modal>
    </React.Fragment>
  )
}

export default ModalOpen
