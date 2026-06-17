import { useCallback, useLayoutEffect } from 'react'

import {
  getAutomaticSeasonTheme,
  getResolvedTheme,
  getStoredSeasonalThemeEnabled,
  isSeasonalTheme,
  normalizeTheme,
  SEASONAL_THEME_ENABLED_STORAGE_KEY,
  THEME,
  themeValues,
  useDarkmodeContext,
} from '@/context/ThemeContext'

const themeBackgrounds: Record<THEME, string> = {
  [THEME.LIGHT]: '#FFFFFF',
  [THEME.DARK]: '#27272A',
  [THEME.CHRISTMAS]: '#b23e3e',
  [THEME.SPRING]: '#fff4f4',
  [THEME.SUMMER]: '#eefbff',
  [THEME.AUTUMN]: '#fff8ef',
  [THEME.WINTER]: '#eff8ff',
}

export const useDarkMode = () => {
  const { setTheme, theme, seasonalThemeEnabled, setSeasonalThemeEnabled } =
    useDarkmodeContext()
  const BAR_STYLE = document.querySelector('meta[name=theme-color]')

  const setCookie = useCallback(
    (cookieName: string, cookieValue: string, validDay: number) => {
      const d = new Date()
      d.setTime(d.getTime() + validDay * (24 * 60 * 60 * 1000))

      const expires = `expires=${d.toUTCString()}`
      document.cookie = `${cookieName}=${cookieValue}; ${expires}; path=/; domain=hybus.app;`
    },
    [],
  )

  const setBarStyle = useCallback(
    (color: string) => {
      BAR_STYLE?.setAttribute('content', color)
    },
    [BAR_STYLE],
  )

  const applyTheme = useCallback(
    (nextTheme: THEME) => {
      document.body.classList.add('transition-colors')
      document.body.classList.remove(...themeValues, 'frozen')
      document.body.classList.add(nextTheme)
      document.body.style.backgroundColor = themeBackgrounds[nextTheme]
      setBarStyle(themeBackgrounds[nextTheme])
    },
    [setBarStyle],
  )

  const setThemeMode = useCallback(
    (
      nextTheme: THEME,
      options?: { seasonalThemeEnabled?: boolean; storeTheme?: boolean },
    ) => {
      const nextSeasonalThemeEnabled =
        options?.seasonalThemeEnabled ?? isSeasonalTheme(nextTheme)

      window.localStorage.setItem(
        SEASONAL_THEME_ENABLED_STORAGE_KEY,
        nextSeasonalThemeEnabled ? 'true' : 'false',
      )

      if (options?.storeTheme === false) {
        window.localStorage.removeItem('theme')
      } else {
        window.localStorage.setItem('theme', nextTheme)
      }

      setSeasonalThemeEnabled(nextSeasonalThemeEnabled)
      setCookie('_theme', nextTheme, 180)
      setTheme(nextTheme)
      applyTheme(nextTheme)
    },
    [applyTheme, setCookie, setSeasonalThemeEnabled, setTheme],
  )

  const setAutomaticTheme = useCallback(() => {
    const nextTheme = getAutomaticSeasonTheme()
    setThemeMode(nextTheme, { seasonalThemeEnabled: true, storeTheme: false })
  }, [setThemeMode])

  const setSeasonalThemeEnabledMode = useCallback(
    (enabled: boolean) => {
      const nextTheme =
        theme === THEME.DARK
          ? THEME.DARK
          : enabled
            ? getAutomaticSeasonTheme()
            : THEME.LIGHT

      setThemeMode(nextTheme, {
        seasonalThemeEnabled: enabled,
        storeTheme: theme === THEME.DARK || !enabled,
      })
    },
    [setThemeMode, theme],
  )

  const toggleSeasonalTheme = useCallback(() => {
    setSeasonalThemeEnabledMode(!seasonalThemeEnabled)
  }, [seasonalThemeEnabled, setSeasonalThemeEnabledMode])

  const toggleTheme = useCallback(() => {
    const nextTheme =
      theme === THEME.DARK
        ? seasonalThemeEnabled
          ? getAutomaticSeasonTheme()
          : THEME.LIGHT
        : THEME.DARK

    setThemeMode(nextTheme, {
      seasonalThemeEnabled,
      storeTheme: !seasonalThemeEnabled || nextTheme === THEME.DARK,
    })
  }, [seasonalThemeEnabled, setThemeMode, theme])

  const setBackground = useCallback(() => {
    applyTheme(theme)
  }, [applyTheme, theme])

  useLayoutEffect(() => {
    const localTheme = window.localStorage.getItem('theme')
    const normalizedTheme = normalizeTheme(localTheme)
    const nextSeasonalThemeEnabled =
      getStoredSeasonalThemeEnabled(normalizedTheme)
    const nextTheme = getResolvedTheme(
      normalizedTheme,
      nextSeasonalThemeEnabled,
    )

    if (localTheme === 'frozen') {
      window.localStorage.setItem('theme', nextTheme)
    }
    setSeasonalThemeEnabled(nextSeasonalThemeEnabled)
    setTheme(nextTheme)
    applyTheme(nextTheme)
    setCookie('_theme', nextTheme, 180)
  }, [applyTheme, setCookie, setSeasonalThemeEnabled, setTheme])

  return {
    toggleTheme,
    setBackground,
    setThemeMode,
    setAutomaticTheme,
    seasonalThemeEnabled,
    toggleSeasonalTheme,
    setSeasonalThemeEnabledMode,
  }
}
