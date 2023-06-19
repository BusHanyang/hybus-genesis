import 'react-tiny-fab/dist/styles.css'
import './fab.scss'

import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Action, Fab } from 'react-tiny-fab'
import styled from 'styled-components'
import tw from 'twin.macro'

import DarkImg from '/image/dark_mode_black_48dp.svg'
import Email from '/image/email_black_48dp.svg'
import Arrow from '/image/expand_less_white_48dp.svg'
import Info from '/image/infoblack.svg'
import LangImg from '/image/lang_black_48dp.svg'
import LightImg from '/image/light_mode_black_48dp.svg'
import Donate from '/image/local_cafe_black_48dp.svg'

import { useDarkmodeContext } from '../../context/ThemeContext'
import { useDarkMode } from '../useDarkMode'

const Icons = styled.div<{ theme: string }>`
  ${({ theme }) => {
    return theme === 'dark' ? tw`invert` : null
  }}
`
const FabBackground = styled.div<{ open: boolean }>`
  ${tw`select-none font-Ptd`}
  ${({ open }) => {
    return open ? tw`fixed inset-0 z-10` : null
  }}
`

export const Fabs = (props: {
  openModal: () => void
  mTarget: React.Dispatch<React.SetStateAction<string>>
}) => {
  const { toggleTheme } = useDarkMode()
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const { theme } = useDarkmodeContext()
  const [metadata, setMetadata] = useState<Record<string, string>>({
    changeText: t('dark'),
    changeColor: '#ffffff',
    iconColor: 'black',
    dataTheme: 'white',
    imgIcon: DarkImg,
  }) // white theme is default

  const fabMainStyle: React.CSSProperties = {
    backgroundColor: metadata.changeColor,
    color: metadata.iconColor,
    userSelect: 'none',
    msUserSelect: 'none',
    MozUserSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
  }

  const handleContextMenu = (e: { preventDefault: () => void }) => {
    e.preventDefault()
  }

  const isOpenClass = document.getElementsByClassName('rtf')

  const fabBackgroundRef = useRef<HTMLDivElement>(null)
  const handleClickFabBackground = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === fabBackgroundRef.current) {
      handleClose()
    }
  }

  const handleModalOpen = () => {
    props.openModal()
    props.mTarget('Fabs')
  }

  const handleOpen = (): Promise<React.FC> => {
    return new Promise(() => {
      if (isOpen) {
        setIsOpen(false)
        isOpenClass[0].classList.remove('open')
        isOpenClass[0].classList.add('closed')
      } else {
        setIsOpen(true)
        isOpenClass[0].classList.remove('closed')
        isOpenClass[0].classList.add('open')
      }
    })
  }
  const handleClose = (): Promise<React.FC> => {
    return new Promise(() => {
      setIsOpen(false)
      isOpenClass[0].classList.remove('open')
      isOpenClass[0].classList.add('closed')
    })
  }

  const handleEmailOnClick = (): Promise<React.FC> => {
    return new Promise(() => {
      window.location.href = 'mailto:admin@hybus.app'
    })
  }
  const handleDonateOnClick = (): Promise<React.FC> => {
    return new Promise(() => {
      window.open('https://toss.me/bushanyang', '_blank')
    })
  }
  const handleDarkOnClick = (): Promise<React.FC> => {
    return new Promise(() => {
      toggleTheme()
    })
  }
  const handleLangOnClick = (): Promise<React.FC> => {
    return new Promise(() => {
      if (i18n.language === 'en') {
        i18n.changeLanguage('ko')
        window.localStorage.setItem('lang', 'ko')
      } else {
        i18n.changeLanguage('en')
        window.localStorage.setItem('lang', 'en')
      }
    })
  }

  React.useLayoutEffect(() => {
    if (theme === 'dark') {
      setMetadata({
        changeText: t('light'),
        changeColor: '#374151',
        iconColor: 'white',
        dataTheme: 'dark',
        imgIcon: LightImg,
      })
    } else {
      setMetadata({
        changeText: t('dark'),
        changeColor: '#ffffff',
        iconColor: 'black',
        dataTheme: 'white',
        imgIcon: DarkImg,
      })
    }
  }, [t, theme])

  return (
    <>
      <FabBackground
        open={isOpen}
        onClick={handleClickFabBackground}
        ref={fabBackgroundRef}
      />
      <Fab
        icon={
          <img
            className="iconImg w-12 h-12 cursor-default mx-auto drag-save-n"
            src={Arrow}
            data-theme={metadata.dataTheme}
            alt="floating action button icon"
            draggable="false"
            onContextMenu={handleContextMenu}
          />
        }
        mainButtonStyles={{ backgroundColor: '#7099C1', fontSize: '10px' }}
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          right: '1.5rem',
          margin: '0px',
          padding: '0px',
          zIndex: 15,
          fontFamily: 'Pretendard',
        }}
        alwaysShowTitle={true}
        onClick={handleOpen}
      >
        <Action
          text={metadata.changeText}
          style={fabMainStyle}
          onClick={handleDarkOnClick}
          onContextMenu={handleContextMenu}
        >
          <Icons theme={metadata.dataTheme}>
            <img
              className="cursor-default mx-auto drag-save-n"
              src={metadata.imgIcon}
              style={{ padding: 8 }}
              alt="light and dark mode icon"
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
            />
          </Icons>
        </Action>
        <Action
          text={t('changeLang')}
          style={fabMainStyle}
          onClick={handleLangOnClick}
          onContextMenu={handleContextMenu}
        >
          <Icons theme={metadata.dataTheme}>
            <img
              className="cursor-default mx-auto drag-save-n"
              src={LangImg}
              style={{ padding: 8 }}
              alt="language icon"
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
            />
          </Icons>
        </Action>
        <Action
          text={t('changelog')}
          style={fabMainStyle}
          onClick={handleModalOpen}
          onContextMenu={handleContextMenu}
        >
          <Icons theme={metadata.dataTheme}>
            <img
              className="cursor-default mx-auto drag-save-n"
              src={Info}
              style={{ padding: 8 }}
              alt="changelog icon"
              draggable="false"
            />
          </Icons>
        </Action>
        <Action
          text={t('donate')}
          style={fabMainStyle}
          onClick={handleDonateOnClick}
          onContextMenu={handleContextMenu}
        >
          <Icons theme={metadata.dataTheme}>
            <img
              className="cursor-default mx-auto drag-save-n"
              src={Donate}
              style={{ padding: 8 }}
              alt="donate a cup of coffee icon"
              draggable="false"
            />
          </Icons>
        </Action>
        <Action
          text={t('ask')}
          style={fabMainStyle}
          onClick={handleEmailOnClick}
          onContextMenu={handleContextMenu}
        >
          <Icons theme={metadata.dataTheme}>
            <img
              className="cursor-default mx-auto drag-save-n"
              src={Email}
              style={{ padding: 8 }}
              alt="email icon"
              draggable="false"
            />
          </Icons>
        </Action>
      </Fab>
    </>
  )
}
