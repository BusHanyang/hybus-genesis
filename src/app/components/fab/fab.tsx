import 'react-tiny-fab/dist/styles.css'
import './fab.scss'

import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Action, Fab } from 'react-tiny-fab'
import styled from 'styled-components'
import tw from 'twin.macro'

//import ChristmasImg from '/image/christmas_mode_black_48dp.svg'
import DarkImg from '/image/dark_mode_black_48dp.svg'
import Email from '/image/email_black_48dp.svg'
import Arrow from '/image/expand_less_white_48dp.svg'
import SpringImg from '/image/flower.svg'
import Info from '/image/infoblack.svg'
import LangImg from '/image/lang_black_48dp.svg'
import LightImg from '/image/light_mode_black_48dp.svg'
import Donate from '/image/local_cafe_black_48dp.svg'
import { useDarkmodeContext } from '@/context/ThemeContext'

import { useDarkMode } from '../useDarkMode'

const Icons = styled.div<{ theme: string }>`
  ${tw`transition duration-300`}
  ${({ theme }) => {
    return theme !== 'light' ? tw`invert` : null
  }}
`

const FabBackground = styled.div<{ open: boolean }>`
  ${tw`select-none font-Ptd`}
  ${({ open }) => {
    return open ? tw`fixed inset-0 z-[2]` : null
  }}
`
/** This function is decide sideFabs' position and delay according to the index,
 * So the sideFabs can appear one by one.
 * @param index - The index of the sideFab.
 * @returns The translate, opacity and delay of the sideFab according to the index.
 * */
const sideFabIndexStyle = (index: number) => {
  switch (index) {
    case 1:
      return tw`translate-x-[-3.5rem] opacity-100`
    case 2:
      return tw`translate-x-[-7rem] delay-[75ms] opacity-100`
    case 3:
      return tw`translate-x-[-10.5rem] delay-[150ms] opacity-100`
    default:
      return tw``
  }
}

const SideFabContainer = styled.div<{ $hover: boolean }>`
  ${tw`absolute h-[3rem] right-[0.2rem] flex flex-row-reverse`}
  ${(props) => (props.$hover ? tw`w-[14rem]` : tw``)}
`

const SideFab = styled.div<{ $hover: boolean; $index: number }>`
  ${tw`absolute h-[3rem] w-[3rem] p-[0.5rem] rounded-full cursor-default justify-center shadow-[0_0_4px_rgba(0,0,0,.14)] shadow-[0_4px_8px_rgba(0,0,0,.28)] transform duration-150`}
  ${(props) => (props.$hover ? sideFabIndexStyle(props.$index) : tw`opacity-0`)}
`

const SideFabSpan = styled.span`
  ${tw`absolute top-[-1.2rem] font-Ptd bg-black/75 text-[13px] py-[0.125rem] px-[0.25rem] shadow-xl font-normal`}
`

const Fabs = (props: {
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
    dataTheme: 'light',
    imgIcon: DarkImg,
  }) // white theme is default
  // When the user hover or click over the language change button, the sideFab appears.
  const [interactLang, setInteractLang] = useState(false)
  // SideFab can click only when the sideFabLoading is true (300ms delay after interactLang is true).
  const [sideFabLoading, setSideFabLoading] = useState(false)

  // Make the sideFabLoading true after 300ms delay when the interactLang is true.
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (interactLang) timer = setTimeout(() => setSideFabLoading(true), 300)
    else setSideFabLoading(false)

    return () => clearTimeout(timer)
  }, [interactLang])

  const fabMainStyle: React.CSSProperties = {
    position: 'relative',
    backgroundColor: metadata.changeColor,
    color: metadata.iconColor,
    userSelect: 'none',
    msUserSelect: 'none',
    MozUserSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    zIndex: 5,
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
      window.open('https://toss.me/bushanyang/1000', '_blank')
    })
  }
  const handleDarkOnClick = (): Promise<React.FC> => {
    return new Promise(() => {
      toggleTheme()
    })
  }
  const handleLangOnClick = (type: string): Promise<React.FC> => {
    return new Promise(() => {
      if (!sideFabLoading) return
      if (i18n.language !== type) {
        i18n.changeLanguage(type)
        window.localStorage.setItem('language', type)
      }
    })
  }

  React.useLayoutEffect(() => {
    if (theme === 'dark') {
      setMetadata({
        // changeText: t('light'),
        // changeText: t('christmas'),
        changeText: t('spring'),
        changeColor: '#374151',
        iconColor: 'white',
        dataTheme: 'dark',
        // imgIcon: LightImg,
        // imgIcon: ChristmasImg,
        imgIcon: SpringImg,
      })
    } else if (theme === 'christmas') {
      setMetadata({
        changeText: t('light'),
        changeColor: 'var(--color-theme-main)',
        iconColor: 'white',
        dataTheme: 'christmas',
        imgIcon: LightImg,
      })
    } else if (theme === 'spring') {
      setMetadata({
        changeText: t('light'),
        changeColor: '#e37da6',
        iconColor: 'white',
        dataTheme: 'spring',
        imgIcon: LightImg,
      })
    } else {
      setMetadata({
        changeText: t('dark'),
        changeColor: '#FFFFFF',
        iconColor: 'black',
        dataTheme: 'light',
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
        mainButtonStyles={{
          backgroundColor:
            metadata.dataTheme === 'light'
              ? '#7099C1'
              : 'var(--color-fab-color)',
          fontSize: '10px',
        }}
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
          onMouseEnter={() => setInteractLang(true)}
          onMouseLeave={() => setInteractLang(false)}
          text={interactLang ? '' : t('changeLang')}
          style={fabMainStyle}
          onClick={() => setInteractLang(!interactLang)}
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
          <SideFabContainer $hover={interactLang}>
            <SideFab
              onClick={() => {
                handleLangOnClick('ko')
              }}
              $index={1}
              $hover={interactLang}
              style={{ backgroundColor: metadata.changeColor }}
            >
              <SideFabSpan className='right-[0.2rem]'>한국어</SideFabSpan>
            </SideFab>
            <SideFab
              onClick={() => {
                handleLangOnClick('en')
              }}
              $index={2}
              $hover={interactLang}
              style={{ backgroundColor: metadata.changeColor }}
            >
              <SideFabSpan className='right-[0rem]'>English</SideFabSpan>
            </SideFab>
            <SideFab
              onClick={() => {
                handleLangOnClick('cn')
              }}
              $index={3}
              $hover={interactLang}
              style={{ backgroundColor: metadata.changeColor }}
            >
              <SideFabSpan className='right-[0.2rem]'>中国人</SideFabSpan>
            </SideFab>
          </SideFabContainer>
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

export default Fabs
