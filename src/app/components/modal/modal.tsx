import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import tw from 'twin.macro'

import { useDarkmodeContext } from '../../context/ThemeContext'

const ModalBackground = styled.div<{ isOpen: boolean }>`
  ${tw`hidden fixed inset-0 z-99 bg-black/60 select-none`}
  ${({ isOpen }) => {
    return isOpen ? tw`flex items-center` : null
  }}
`
const ModalMain = styled(ModalBackground)<{ isOpen: boolean; isAni: boolean }>`
  ${({ isOpen }) => {
    return isOpen ? tw`flex items-center animate-modalBgShow` : null
  }}
  ${({ isAni }) => {
    return isAni ? tw`animate-modalBgClose` : null
  }}
`
const ModalButton = styled.button`
  ${tw`outline-none cursor-pointer border-0`}
`
const ModalSection = styled.section<{ isAni: boolean }>`
  ${tw`w-11/12 max-w-screen-sm mx-auto rounded-lg bg-white overflow-auto animate-modalShow`}
  ${({ isAni }) => {
    return isAni ? tw`animate-modalClose` : null
  }}
`
const ModalHeader = styled.header<{ theme: string }>`
  ${({ theme }) => {
    return theme === 'dark'
      ? tw`relative pt-4 pr-16 pb-4 pl-4 bg-zinc-800 font-bold text-white font-Ptd`
      : tw`relative pt-4 pr-16 pb-4 pl-4 bg-white font-bold font-Ptd`
  }}
`
const ModalFooterButton = styled(ModalButton)`
  ${tw`py-2 px-4 text-white bg-gray-500 font-Ptd rounded-md text-xs`}
`

const ModalSubMain = styled.main<{ theme: string }>`
  ${({ theme }) => {
    return theme === 'dark'
      ? tw`p-4 border-y border-solid border-zinc-800 bg-gray-700 text-white`
      : tw`p-4 border-y border-solid border-sky-50`
  }}
`

const ModalFooter = styled.footer<{ theme: string }>`
  ${({ theme }) => {
    return theme === 'dark'
      ? tw`py-3 px-4 text-right text-white bg-gray-700`
      : tw`py-3 px-4 text-right`
  }}
`

export const Modal = (props: {
  ani: boolean
  open: boolean
  close: () => void
  children: React.ReactNode
}) => {
  const modalBackgroundRef = useRef<HTMLDivElement>(null)
  const handleClickModalBackground = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === modalBackgroundRef.current) {
      props.close()
    }
  }

  const { theme } = useDarkmodeContext()

  const { t } = useTranslation()

  return (
    <ModalBackground isOpen={props.open} onClick={handleClickModalBackground}>
      <ModalMain isOpen={props.open} isAni={props.ani} ref={modalBackgroundRef}>
        {props.open ? (
          <ModalSection isAni={props.ani}>
            <ModalHeader theme={theme}>{t('changelog')}</ModalHeader>

            <ModalSubMain theme={theme}>{props.children}</ModalSubMain>
            <ModalFooter theme={theme}>
              <ModalFooterButton className="close" onClick={props.close}>
                닫기
              </ModalFooterButton>
            </ModalFooter>
          </ModalSection>
        ) : null}
      </ModalMain>
    </ModalBackground>
  )
}
