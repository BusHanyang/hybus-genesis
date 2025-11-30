import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import tw from 'twin.macro'

import { useDarkmodeContext } from '@/context/ThemeContext'

const ModalBackground = styled.div<{ $isopen: boolean }>`
  ${tw`hidden fixed inset-0 z-99 bg-black/60 select-none`}
  ${({ $isopen }) => {
    return $isopen ? tw`flex items-center` : null
  }}
`

const ModalMain = styled(ModalBackground)<{
  $isopen: boolean
  $isani: boolean
}>`
  ${({ $isopen }) => {
    return $isopen ? tw`flex items-center animate-modalBgShow` : null
  }}
  ${({ $isani }) => {
    return $isani ? tw`animate-modalBgClose` : null
  }}
`

const ModalButton = styled.button`
  ${tw`outline-none cursor-pointer border-0`}
`

const ModalSection = styled.section<{ $isani: boolean }>`
  ${tw`w-11/12 max-w-screen-sm mx-auto rounded-lg bg-white overflow-auto animate-modalShow`}
  ${({ $isani }) => {
    return $isani ? tw`animate-modalClose` : null
  }}
`

const ModalHeader = styled.header<{ theme: string }>`
  ${tw`relative pt-4 pr-16 pb-4 pl-4 font-bold font-Ptd`}
  ${({ theme }) => {
    return theme === 'dark' ? tw`bg-zinc-800 text-white` : tw`bg-white`
  }}
`

const ModalFooterButton = styled(ModalButton)`
  ${tw`py-2 px-4 text-white bg-gray-500 font-Ptd rounded-md text-xs`}
`

const ModalSubMain = styled.main<{ theme: string }>`
  ${tw`p-4 border-y border-solid`}
  ${({ theme }) => {
    return theme === 'dark'
      ? tw`border-zinc-800 bg-gray-700 text-white`
      : tw`border-sky-50`
  }}
`

const ModalFooter = styled.footer<{ theme: string }>`
  ${tw`py-3 px-4 text-right`}
  ${({ theme }) => {
    if (theme === 'dark') {
      return tw`text-white bg-gray-700`
    }
  }}
`

export const Modal = (props: {
  ani: boolean
  open: boolean
  close: () => void
  children: React.ReactNode
  mTarget: string
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
    <ModalBackground $isopen={props.open} onClick={handleClickModalBackground}>
      <ModalMain
        $isopen={props.open}
        $isani={props.ani}
        ref={modalBackgroundRef}
      >
        {props.open ? (
          <ModalSection $isani={props.ani}>
            {props.mTarget === 'Fabs' && (
              <ModalHeader theme={theme}>{t('changelog')}</ModalHeader>
            )}
            {props.mTarget === 'Info' && (
              <ModalHeader theme={theme}>{t('info')}</ModalHeader>
            )}
            {props.mTarget === 'Christmas' && (
              <ModalHeader theme={theme}>{t('christmas')}</ModalHeader>
            )}
            {props.mTarget === 'Spring' && (
              <ModalHeader theme={theme}>{t('spring')}</ModalHeader>
            )}
            {props.mTarget === 'Notice' && (
              <ModalHeader theme={theme}>공지사항</ModalHeader>
            )}

            <ModalSubMain theme={theme}>{props.children}</ModalSubMain>
            <ModalFooter theme={theme}>
              <ModalFooterButton className="close" onClick={props.close}>
                {t('close')}
              </ModalFooterButton>
            </ModalFooter>
          </ModalSection>
        ) : null}
      </ModalMain>
    </ModalBackground>
  )
}
