import { classed } from '@tw-classed/react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { THEME } from '@/context/ThemeContext'

const ThemeDebugRoot = classed(
  'div',
  'relative z-40 ml-2 inline-flex justify-self-start font-normal',
)
const ThemeDebugTrigger = classed(
  'button',
  'h-7 whitespace-nowrap rounded-md border border-solid border-gray-300 bg-theme-card px-2 text-[11px] font-medium text-theme-text shadow-sm hsm:h-6 hsm:px-1.5 hsm:text-[10px]',
)
const ThemeDebugPanel = classed(
  'div',
  'absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2.5rem)] rounded-xl border border-solid border-gray-200 bg-theme-card p-3 text-theme-text shadow-[0_0.75rem_2rem_rgba(15,23,42,0.22)] hsm:-right-4',
)
const ThemeDebugHeader = classed(
  'div',
  'mb-3 flex items-start justify-between gap-3 text-left',
)
const ThemeDebugTitle = classed('p', 'text-sm font-bold leading-5')
const ThemeDebugDescription = classed(
  'p',
  'text-[10px] leading-4 opacity-70',
)
const ThemeDebugClose = classed(
  'button',
  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-solid border-gray-300 bg-theme-main text-sm leading-none text-theme-text',
)
const ThemeDebugGrid = classed(
  'div',
  'grid grid-cols-2 gap-2',
)
const ThemeDebugOption = classed(
  'button',
  'flex h-10 items-center justify-start gap-2 whitespace-nowrap rounded-lg border border-solid border-gray-200 bg-theme-main px-3 text-xs font-medium text-theme-text aria-pressed:border-gray-500 aria-pressed:font-bold aria-pressed:shadow-[inset_0_0_0_1px_currentColor]',
)
const ThemeSwatch = classed(
  'span',
  'block h-5 w-5 shrink-0 rounded-full border border-solid border-gray-300 shadow-sm',
)
const SelectedMark = classed('span', 'ml-auto text-xs font-bold')

interface ThemeDebugMenuProps {
  theme: THEME
  onSelectTheme: (theme: THEME) => void
  onSelectAutomaticTheme: () => void
}

const ThemeDebugMenu = ({
  theme,
  onSelectTheme,
  onSelectAutomaticTheme,
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
    onSelectTheme(themeName)
    setIsOpen(false)
  }
  const handleAutomaticThemeSelect = () => {
    onSelectAutomaticTheme()
    setIsOpen(false)
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

  return (
    <ThemeDebugRoot ref={rootRef}>
      <ThemeDebugTrigger
        type="button"
        aria-label="테마 설정"
        aria-controls="theme-debug-panel"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        테마<span className="hsm:hidden"> 설정</span>
      </ThemeDebugTrigger>
      {isOpen && (
        <ThemeDebugPanel id="theme-debug-panel" aria-label="테마 설정 디버그">
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
              ×
            </ThemeDebugClose>
          </ThemeDebugHeader>
          <ThemeDebugGrid>
            <ThemeDebugOption
              className="col-span-2 justify-center"
              type="button"
              onClick={handleAutomaticThemeSelect}
            >
              <ThemeSwatch
                style={{
                  background:
                    'linear-gradient(135deg, #e37da6 0%, #2ca6a4 33%, #b45309 66%, #647ab3 100%)',
                }}
              />
              {t('theme_auto')}
            </ThemeDebugOption>
            {themeActions.map((themeAction) => {
              const isSelected = theme === themeAction.theme

              return (
                <ThemeDebugOption
                  key={themeAction.theme}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleThemeSelect(themeAction.theme)}
                >
                  <ThemeSwatch style={{ background: themeAction.swatch }} />
                  {themeAction.text}
                  {isSelected && <SelectedMark aria-hidden="true">✓</SelectedMark>}
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
