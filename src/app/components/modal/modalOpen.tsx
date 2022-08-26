import axios from 'axios'
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
  openModal: () => void
  closeModal: () => void
}) => {
  const [data, setData] = useState<Array<Changelog>>([])
  const [isLoaded, setLoaded] = useState<boolean>(false)
  const url =
    'https://proxy.anoldstory.workers.dev/https://api.hybus.app/changelog/'

  const getChangelog = async (): Promise<Array<Changelog>> => {
    return await axios
      .get(url)
      .then((response) => {
        return response.data
      })
      .catch((error) => {
        console.log(`error ${error}`)
        return null
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
  }, [])

  return (
    <React.Fragment>
      <Modal open={props.isOpen} close={props.closeModal}>
        <div
          className="font-Ptd"
          style={{ overflow: 'auto', maxHeight: '450px' }}
        >
          <ContentArea>
            <ChangelogDiv>
              {data.map((datas: { date: string; details: Array<string> }) => {
                const arr: string[] = datas.details
                return (
                  <ChangelogMargin key={datas.date}>
                    <h4>{datas.date}</h4>
                    {arr.map((item) => (
                      <P key={item}>{item}</P>
                    ))}
                  </ChangelogMargin>
                )
              })}
            </ChangelogDiv>
          </ContentArea>
        </div>
      </Modal>
    </React.Fragment>
  )
}

export default ModalOpen
