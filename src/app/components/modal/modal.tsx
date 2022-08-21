import React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import tw from 'twin.macro'

import { useDarkMode } from '../useDarkMode'

export const Modal = (props: any) => {
  const [themeMode, toggleTheme] = useDarkMode()
  const { open, close, header } = props
  const { t } = useTranslation()
  let dataTheme = ''
  if (useDarkMode()[0] === 'dark') {
    dataTheme = 'dark'
  } else {
    dataTheme = 'white'
  }

  const MainModal = styled.div`
    ${tw`hidden fixed inset-0 z-99 bg-black/60`}
  `
  const ModalMain = styled(MainModal)<{ isOpen: boolean }>`
    ${({ isOpen }) => {
      return isOpen ? tw`flex items-center animate-modalBgShow` : null
    }}
  `
  const ModalButton = styled.button`
    ${tw`outline-none cursor-pointer border-0`}
  `
  const ModalSection = styled.section`
    ${tw`w-11/12 max-w-screen-sm mx-auto rounded-t-lg bg-white overflow-auto animate-modalShow`}
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

  return (
    <ModalMain isOpen={open}>
      {open ? (
        <ModalSection>
          <ModalHeader theme={dataTheme}>{t('changelog')}</ModalHeader>

          <ModalSubMain theme={dataTheme}>{props.children}</ModalSubMain>
          <ModalFooter theme={dataTheme}>
            <ModalFooterButton className="close" onClick={close}>
              닫기
            </ModalFooterButton>
          </ModalFooter>
        </ModalSection>
      ) : null}
    </ModalMain>
  )
}
