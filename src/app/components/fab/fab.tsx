import 'react-tiny-fab/dist/styles.css'
import './fab.css'

import { classed } from '@tw-classed/react'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Action, Fab } from 'react-tiny-fab'

//import ChristmasImg from '/image/christmas_mode_black_48dp.svg'
import DarkImg from '/image/dark_mode_black_48dp.svg'
import Email from '/image/email_black_48dp.svg'
import Arrow from '/image/expand_less_white_48dp.svg'
import ThemeImg from '/image/flower.svg'
//import SpringImg from '/image/flower.svg'
import Info from '/image/infoblack.svg'
import LangImg from '/image/lang_black_48dp.svg'
import LightImg from '/image/light_mode_black_48dp.svg'
import Donate from '/image/local_cafe_black_48dp.svg'
import { THEME, useDarkmodeContext } from '@/context/ThemeContext'

import { useDarkMode } from '../useDarkMode'

const Icons = classed('div', 'transition duration-300', {
  variants: {
    'data-theme': {
      light: '',
      inverted: 'invert',
    },
  },
  defaultVariants: {
    'data-theme': 'light',
  },
})
const FabBackground = classed('div', 'select-none font-Ptd', {
  variants: {
    'data-state': {
      open: 'fixed inset-0 z-10',
      closed: '',
    },
  },
  defaultVariants: {
    'data-state': 'closed',
  },
})
const ThemeSwatch = classed(
  'span',
  'block h-4 w-4 shrink-0 rounded-full border border-solid border-gray-300',
)
const ThemeDebugPanel = classed(
  'div',
  'fixed right-24 bottom-6 z-20 grid w-44 grid-cols-2 gap-2 rounded-lg bg-theme-card p-2 text-theme-text shadow-theme-shadow',
)
const ThemeDebugButton = classed(
  'button',
  'flex h-8 items-center justify-center gap-1 rounded-md border border-solid border-gray-200 bg-theme-main px-2 text-xs font-medium text-theme-text',
)

const Fabs = (props: {
  openModal: () => void
  mTarget: React.Dispatch<React.SetStateAction<string>>
}) => {
  const {
    toggleTheme,
    setThemeMode,
    setAutomaticTheme,
    seasonalThemeEnabled,
    toggleSeasonalTheme,
  } = useDarkMode()
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
      window.open('https://toss.me/bushanyang/1000', '_blank')
    })
  }
  const handleDarkOnClick = (): Promise<React.FC> => {
    return new Promise(() => {
      toggleTheme()
    })
  }
  const handleSeasonalThemeOnClick = (): Promise<React.FC> => {
    return new Promise(() => {
      toggleSeasonalTheme()
    })
  }
  const handleThemeOnClick = (themeName: THEME): void => {
    setThemeMode(themeName)
    handleClose()
  }
  const handleAutoThemeOnClick = (): void => {
    setAutomaticTheme()
    handleClose()
  }
  const handleLangOnClick = (): Promise<React.FC> => {
    return new Promise(() => {
      if (i18n.language === 'en') {
        i18n.changeLanguage('ko')
        window.localStorage.setItem('language', 'ko')
      } else {
        i18n.changeLanguage('en')
        window.localStorage.setItem('language', 'en')
      }
    })
  }

  React.useLayoutEffect(() => {
    if (theme === 'dark') {
      setMetadata({
        changeColor: '#374151',
        changeText: t('light'),
        imgIcon: LightImg,
        iconColor: 'white',
        dataTheme: 'dark',
        // changeText: t('christmas'),
        // imgIcon: ChristmasImg,
        // changeText: t('spring'),
        // imgIcon: SpringImg,
      })
    } else if (theme === 'christmas') {
      setMetadata({
        changeText: t('dark'),
        changeColor: 'var(--color-theme-main)',
        iconColor: 'white',
        dataTheme: 'christmas',
        imgIcon: DarkImg,
      })
    } else if (theme === 'spring') {
      setMetadata({
        changeText: t('dark'),
        changeColor: '#e37da6',
        iconColor: 'white',
        dataTheme: 'spring',
        imgIcon: DarkImg,
      })
    } else if (theme === 'summer') {
      setMetadata({
        changeText: t('dark'),
        changeColor: '#2ca6a4',
        iconColor: 'white',
        dataTheme: 'summer',
        imgIcon: DarkImg,
      })
    } else if (theme === 'autumn') {
      setMetadata({
        changeText: t('dark'),
        changeColor: '#b45309',
        iconColor: 'white',
        dataTheme: 'autumn',
        imgIcon: DarkImg,
      })
    } else if (theme === 'winter') {
      setMetadata({
        changeText: t('dark'),
        changeColor: '#647ab3',
        iconColor: 'white',
        dataTheme: 'winter',
        imgIcon: DarkImg,
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

  const themeActions: Array<{
    theme: THEME
    text: string
    swatch: string
  }> = [
    {
      theme: THEME.LIGHT,
      text: t('light'),
      swatch: '#ffffff',
    },
    {
      theme: THEME.DARK,
      text: t('dark'),
      swatch: '#374151',
    },
    {
      theme: THEME.SPRING,
      text: t('theme_spring'),
      swatch: '#e37da6',
    },
    {
      theme: THEME.SUMMER,
      text: t('theme_summer'),
      swatch: '#2ca6a4',
    },
    {
      theme: THEME.AUTUMN,
      text: t('theme_autumn'),
      swatch: '#b45309',
    },
    {
      theme: THEME.WINTER,
      text: t('theme_winter'),
      swatch: '#647ab3',
    },
    {
      theme: THEME.CHRISTMAS,
      text: t('theme_christmas'),
      swatch:
        'linear-gradient(135deg, #b23e3e 0%, #b23e3e 50%, #3e5f4b 50%, #3e5f4b 100%)',
    },
  ]

  return (
    <>
      <FabBackground
        data-state={isOpen ? 'open' : 'closed'}
        onClick={handleClickFabBackground}
        ref={fabBackgroundRef}
      />
      {isOpen && (
        <ThemeDebugPanel>
          <ThemeDebugButton
            className="col-span-2"
            type="button"
            onClick={handleAutoThemeOnClick}
            onContextMenu={handleContextMenu}
          >
            <ThemeSwatch
              style={{
                background:
                  'linear-gradient(135deg, #e37da6 0%, #2ca6a4 33%, #b45309 66%, #647ab3 100%)',
              }}
            />
            {t('theme_auto')}
          </ThemeDebugButton>
          {themeActions.map((themeAction) => (
            <ThemeDebugButton
              key={themeAction.theme}
              type="button"
              onClick={() => handleThemeOnClick(themeAction.theme)}
              onContextMenu={handleContextMenu}
            >
              <ThemeSwatch style={{ background: themeAction.swatch }} />
              {themeAction.text}
            </ThemeDebugButton>
          ))}
        </ThemeDebugPanel>
      )}
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
          <Icons
            data-theme={metadata.dataTheme === 'light' ? 'light' : 'inverted'}
          >
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
          text={seasonalThemeEnabled ? t('theme_off') : t('theme_on')}
          style={fabMainStyle}
          onClick={handleSeasonalThemeOnClick}
          onContextMenu={handleContextMenu}
        >
          <Icons
            data-theme={metadata.dataTheme === 'light' ? 'light' : 'inverted'}
          >
            <img
              className="cursor-default mx-auto drag-save-n"
              src={ThemeImg}
              style={{ padding: 8 }}
              alt="seasonal theme icon"
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
          <Icons
            data-theme={metadata.dataTheme === 'light' ? 'light' : 'inverted'}
          >
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
          <Icons
            data-theme={metadata.dataTheme === 'light' ? 'light' : 'inverted'}
          >
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
          <Icons
            data-theme={metadata.dataTheme === 'light' ? 'light' : 'inverted'}
          >
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
          <Icons
            data-theme={metadata.dataTheme === 'light' ? 'light' : 'inverted'}
          >
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
