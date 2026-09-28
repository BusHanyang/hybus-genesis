import { classed } from '@tw-classed/react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import CafeImg from '/public/image/cafe_outline_24dp.svg?react'
import ChevronImg from '/public/image/chevron_up_24dp.svg?react'
import DarkImg from '/public/image/dark_mode_outline_24dp.svg?react'
import ThemeImg from '/public/image/flower_outline_24dp.svg?react'
import LangImg from '/public/image/language_outline_24dp.svg?react'
import LightImg from '/public/image/light_mode_outline_24dp.svg?react'
import ChangelogImg from '/public/image/list_outline_24dp.svg?react'
import EmailImg from '/public/image/mail_outline_24dp.svg?react'
import { runThemeTransition } from '@/components/theme/themeTransition'
import { THEME, useDarkmodeContext } from '@/context/ThemeContext'

import { useDarkMode } from '../useDarkMode'

const closedByDefault = { 'data-open': 'false' } as const

const FabScrim = classed(
  'div',
  'fixed inset-0 z-20 bg-scrim backdrop-blur-[3px] transition-opacity duration-300',
  {
    variants: {
      'data-open': {
        true: 'pointer-events-auto opacity-100',
        false: 'pointer-events-none opacity-0',
      },
    },
    defaultVariants: closedByDefault,
  },
)
// Fixed to the viewport, above the home indicator, and aligned with the right
// edge of the (max 30rem) content column on wide screens. The box spans the
// closed menu too, so it lets clicks through and only its buttons take them.
const FabRoot = classed(
  'div',
  'pointer-events-none fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[max(1.5rem,calc((100%-30rem)/2+1.25rem))] z-30 flex select-none flex-col items-end font-Ptd',
)
const FabList = classed('div', 'mb-3.5 flex flex-col items-end gap-3', {
  variants: {
    // Stay visible until the items have finished leaving.
    'data-open': {
      true: 'pointer-events-auto visible',
      false: 'invisible [transition:visibility_0s_linear_.5s]',
    },
  },
  defaultVariants: closedByDefault,
})
const FabItem = classed('button', 'flex items-center gap-2.5')
const FabLabel = classed(
  'span',
  'flex h-[30px] items-center whitespace-nowrap rounded-[15px] bg-theme-card px-3 text-[13.5px] font-bold text-theme-text shadow-theme-shadow [transition:opacity_.25s_ease,translate_.45s_cubic-bezier(.34,1.45,.64,1),background-color_.35s_ease,color_.35s_ease]',
  {
    variants: {
      'data-open': {
        true: 'translate-x-0 opacity-100',
        false: 'translate-x-3 opacity-0',
      },
    },
    defaultVariants: closedByDefault,
  },
)
const FabAction = classed(
  'span',
  'flex h-[46px] w-[46px] items-center justify-center rounded-full bg-theme-card text-theme-text shadow-theme-shadow [transition:opacity_.25s_ease,translate_.45s_cubic-bezier(.34,1.45,.64,1),scale_.45s_cubic-bezier(.34,1.45,.64,1),background-color_.35s_ease,color_.35s_ease]',
  {
    variants: {
      'data-open': {
        true: 'translate-y-0 scale-100 opacity-100',
        false: 'translate-y-[18px] scale-50 opacity-0',
      },
    },
    defaultVariants: closedByDefault,
  },
)
const FabMain = classed(
  'button',
  'pointer-events-auto flex h-[58px] w-[58px] items-center justify-center rounded-full bg-fab-color text-white shadow-fab transition-[scale,background-color] duration-150 active:scale-[.96]',
)
const FabMainIcon = classed(
  ChevronImg,
  'h-7 w-7 stroke-[2.6] transition-transform duration-[450ms] ease-bouncy',
  {
    variants: {
      'data-open': {
        true: 'rotate-180',
        false: 'rotate-0',
      },
    },
    defaultVariants: closedByDefault,
  },
)
const iconClass = 'h-[21px] w-[21px]'
const DarkIcon = classed(DarkImg, iconClass)
const LightIcon = classed(LightImg, iconClass)
const ThemeIcon = classed(ThemeImg, iconClass)
const LangIcon = classed(LangImg, iconClass)
const ChangelogIcon = classed(ChangelogImg, iconClass)
const DonateIcon = classed(CafeImg, iconClass)
const EmailIcon = classed(EmailImg, iconClass)

type FabMenuAction = {
  key: string
  label: string
  icon: React.ReactNode
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}

const Fabs = (props: {
  openModal: () => void
  mTarget: React.Dispatch<React.SetStateAction<string>>
}) => {
  const { toggleTheme, toggleSeasonalTheme, seasonalThemeEnabled } =
    useDarkMode()
  const { theme } = useDarkmodeContext()
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const open = isOpen ? 'true' : 'false'
  const listRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLButtonElement>(null)

  // Closing hides the menu from assistive tech, so hand focus back to the main
  // button if it was on one of the items.
  useEffect(() => {
    if (isOpen) return
    if (listRef.current?.contains(document.activeElement)) {
      mainRef.current?.focus({ preventScroll: true })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleContextMenu = (e: { preventDefault: () => void }) => {
    e.preventDefault()
  }

  // The reveal grows from the icon that was pressed.
  const switchTheme =
    (update: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
      const origin = e.currentTarget.lastElementChild ?? e.currentTarget
      runThemeTransition(origin, () => {
        update()
        setIsOpen(false)
      })
    }

  const actions: Array<FabMenuAction> = [
    {
      key: 'dark',
      label: theme === THEME.DARK ? t('light') : t('dark'),
      icon: theme === THEME.DARK ? <LightIcon /> : <DarkIcon />,
      onClick: switchTheme(toggleTheme),
    },
    {
      key: 'theme',
      label: seasonalThemeEnabled ? t('theme_off') : t('theme_on'),
      icon: <ThemeIcon />,
      onClick: switchTheme(toggleSeasonalTheme),
    },
    {
      key: 'lang',
      label: t('changeLang'),
      icon: <LangIcon />,
      onClick: () => {
        const nextLanguage = i18n.language === 'en' ? 'ko' : 'en'
        void i18n.changeLanguage(nextLanguage)
        window.localStorage.setItem('language', nextLanguage)
      },
    },
    {
      key: 'changelog',
      label: t('changelog'),
      icon: <ChangelogIcon />,
      onClick: () => {
        setIsOpen(false)
        props.openModal()
        props.mTarget('Fabs')
      },
    },
    {
      key: 'donate',
      label: t('donate'),
      icon: <DonateIcon />,
      onClick: () => {
        window.open('https://toss.me/bushanyang/1000', '_blank')
      },
    },
    {
      key: 'ask',
      label: t('ask'),
      icon: <EmailIcon />,
      onClick: () => {
        window.location.href = 'mailto:admin@hybus.app'
      },
    },
  ]
  const last = actions.length - 1

  return (
    <>
      <FabScrim
        aria-hidden="true"
        data-open={open}
        onClick={() => setIsOpen(false)}
      />
      <FabRoot onContextMenu={handleContextMenu}>
        <FabList
          ref={listRef}
          id="fab-menu"
          aria-hidden={!isOpen}
          data-open={open}
        >
          {actions.map((action, i) => {
            // Items pop out from the bottom up and tuck back in top-down.
            const delay = isOpen ? (last - i) * 40 : i * 25

            return (
              <FabItem
                key={action.key}
                type="button"
                tabIndex={isOpen ? 0 : -1}
                onClick={action.onClick}
              >
                <FabLabel
                  data-open={open}
                  style={{ transitionDelay: `${isOpen ? delay + 70 : delay}ms` }}
                >
                  {action.label}
                </FabLabel>
                <FabAction
                  aria-hidden="true"
                  data-open={open}
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  {action.icon}
                </FabAction>
              </FabItem>
            )
          })}
        </FabList>
        <FabMain
          ref={mainRef}
          type="button"
          aria-label={isOpen ? t('close_menu') : t('open_menu')}
          aria-expanded={isOpen}
          aria-controls="fab-menu"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FabMainIcon aria-hidden="true" data-open={open} />
        </FabMain>
      </FabRoot>
    </>
  )
}

export default Fabs
