import { classed } from '@tw-classed/react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import CheckImg from '/public/image/check_outline_24dp.svg?react'
import CloseImg from '/public/image/close_outline_24dp.svg?react'
import { runThemeTransition } from '@/components/theme/themeTransition'
import { isSeasonalTheme, THEME } from '@/context/ThemeContext'

const ThemeDebugRoot = classed(
  'div',
  'relative ml-2 inline-flex justify-self-start font-normal',
)
const ThemeDebugTrigger = classed(
  'button',
  'h-7 whitespace-nowrap rounded-[7px] border border-solid border-off bg-theme-card px-2 text-[11.5px] font-semibold text-theme-text shadow-[0_1px_2px_rgba(0,0,0,.06)] transition-[scale,background-color,color] duration-150 active:scale-[.96] hsm:h-6 hsm:px-1.5 hsm:text-[10px]',
)
const TriggerSuffix = classed('span', 'hsm:hidden')
const ThemeDebugPanel = classed(
  'div',
  'absolute right-0 top-[calc(100%+10px)] z-40 w-[262px] max-w-[calc(100vw-2.5rem)] origin-top-right rounded-[14px] border border-solid border-off bg-theme-card p-3 text-theme-text shadow-[0_12px_32px_rgba(15,23,42,.22)] animate-dev-in hsm:-right-4',
)
const ThemeDebugHeader = classed(
  'div',
  'mb-3 flex items-start justify-between gap-3 text-left',
)
const ThemeDebugTitle = classed('p', 'm-0 text-sm font-extrabold leading-[1.4]')
const ThemeDebugDescription = classed(
  'p',
  'm-0 mt-0.5 text-[11px] leading-[1.45] text-ink-2',
)
const ThemeDebugClose = classed(
  'button',
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-solid border-off bg-theme-main text-theme-text transition-[scale] duration-150 active:scale-[.96]',
)
const CloseIcon = classed(CloseImg, 'h-[13px] w-[13px]')
const ThemeDebugGrid = classed('div', 'grid grid-cols-2 gap-2')
const ThemeDebugOption = classed(
  'button',
  'flex h-10 items-center gap-2 whitespace-nowrap rounded-[10px] border border-solid bg-theme-main px-2.5 text-[12.5px] text-theme-text transition-[scale,box-shadow,border-color] duration-150 active:scale-[.96] animate-[hb-rise_.3s_cubic-bezier(.2,.8,.2,1)_both]',
  {
    variants: {
      'data-selected': {
        true: 'border-ink-2 font-extrabold shadow-[inset_0_0_0_1px_var(--color-theme-text)]',
        false: 'border-off font-semibold',
      },
      'data-span': {
        true: 'col-span-2 justify-center',
        false: 'justify-start',
      },
    },
    defaultVariants: {
      'data-selected': 'false',
      'data-span': 'false',
    },
  },
)
const ThemeSwatch = classed(
  'span',
  'block h-5 w-5 shrink-0 rounded-full border border-solid border-black/15 shadow-[0_1px_2px_rgba(0,0,0,.08)]',
)
const SelectedMark = classed(
  CheckImg,
  'ml-auto h-3.5 w-3.5 shrink-0 stroke-[3] animate-pop-sm',
)

interface ThemeDebugMenuProps {
  theme: THEME
  manualSeasonalTheme: THEME | null
  seasonalThemeEnabled: boolean
  onSelectTheme: (theme: THEME) => void
  onSelectManualTheme: (theme: THEME) => void
  onSelectAutomaticTheme: () => void
  onToggleTheme: () => void
}

const ThemeDebugMenu = ({
  theme,
  manualSeasonalTheme,
  seasonalThemeEnabled,
  onSelectTheme,
  onSelectManualTheme,
  onSelectAutomaticTheme,
  onToggleTheme,
}: ThemeDebugMenuProps) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleThemeSelect = (themeName: THEME) => {
    if (themeName === THEME.DARK) {
      if (theme !== THEME.DARK) onToggleTheme()
    } else if (themeName === THEME.LIGHT && theme === THEME.DARK) {
      onToggleTheme()
    } else if (isSeasonalTheme(themeName)) {
      onSelectManualTheme(themeName)
    } else {
      onSelectTheme(themeName)
    }
    setIsOpen(false)
  }
  const handleAutomaticThemeSelect = () => {
    onSelectAutomaticTheme()
    setIsOpen(false)
  }
  const withReveal =
    (update: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
      runThemeTransition(e.currentTarget, update)
    }

  const themeActions: Array<{
    theme: THEME
    text: string
    swatch: string
  }> = [
    { theme: THEME.LIGHT, text: t('light'), swatch: '#ffffff' },
    { theme: THEME.DARK, text: t('dark'), swatch: '#374151' },
    { theme: THEME.SPRING, text: t('theme_spring'), swatch: '#e37da6' },
    { theme: THEME.SUMMER, text: t('theme_summer'), swatch: '#2ca6a4' },
    { theme: THEME.AUTUMN, text: t('theme_autumn'), swatch: '#b45309' },
    { theme: THEME.WINTER, text: t('theme_winter'), swatch: '#647ab3' },
    {
      theme: THEME.CHRISTMAS,
      text: t('theme_christmas'),
      swatch:
        'linear-gradient(135deg, #b23e3e 0%, #b23e3e 50%, #3e5f4b 50%, #3e5f4b 100%)',
    },
  ]
  const automaticThemeSelected =
    seasonalThemeEnabled && manualSeasonalTheme === null

  return (
    <ThemeDebugRoot ref={rootRef}>
      <ThemeDebugTrigger
        type="button"
        aria-label="테마 설정"
        aria-controls="theme-debug-panel"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        테마<TriggerSuffix> 설정</TriggerSuffix>
      </ThemeDebugTrigger>
      {isOpen && (
        <ThemeDebugPanel
          id="theme-debug-panel"
          role="dialog"
          aria-label="테마 설정 디버그"
        >
          <ThemeDebugHeader>
            <div>
              <ThemeDebugTitle>테마 미리보기</ThemeDebugTitle>
              <ThemeDebugDescription>
                개발 모드에서만 표시되는 선택 메뉴입니다.
              </ThemeDebugDescription>
            </div>
            <ThemeDebugClose
              type="button"
              aria-label="테마 설정 닫기"
              onClick={() => setIsOpen(false)}
            >
              <CloseIcon aria-hidden="true" />
            </ThemeDebugClose>
          </ThemeDebugHeader>
          <ThemeDebugGrid>
            <ThemeDebugOption
              type="button"
              aria-pressed={automaticThemeSelected}
              data-selected={automaticThemeSelected ? 'true' : 'false'}
              data-span="true"
              style={{ animationDelay: '30ms' }}
              onClick={withReveal(handleAutomaticThemeSelect)}
            >
              <ThemeSwatch
                style={{
                  background:
                    'linear-gradient(135deg, #e37da6 0%, #2ca6a4 33%, #b45309 66%, #647ab3 100%)',
                }}
              />
              {t('theme_auto')}
              {automaticThemeSelected && <SelectedMark aria-hidden="true" />}
            </ThemeDebugOption>
            {themeActions.map((themeAction, i) => {
              const isSelected = isSeasonalTheme(themeAction.theme)
                ? seasonalThemeEnabled &&
                  manualSeasonalTheme === themeAction.theme
                : theme === themeAction.theme

              return (
                <ThemeDebugOption
                  key={themeAction.theme}
                  type="button"
                  aria-pressed={isSelected}
                  data-selected={isSelected ? 'true' : 'false'}
                  style={{ animationDelay: `${55 + i * 25}ms` }}
                  onClick={withReveal(() =>
                    handleThemeSelect(themeAction.theme),
                  )}
                >
                  <ThemeSwatch style={{ background: themeAction.swatch }} />
                  {themeAction.text}
                  {isSelected && <SelectedMark aria-hidden="true" />}
                </ThemeDebugOption>
              )
            })}
          </ThemeDebugGrid>
        </ThemeDebugPanel>
      )}
    </ThemeDebugRoot>
  )
}

export default ThemeDebugMenu
