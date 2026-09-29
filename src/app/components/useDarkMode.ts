import { useCallback } from 'react'

import {
  getAutomaticSeasonTheme,
  isSeasonalTheme,
  SEASONAL_THEME_ENABLED_STORAGE_KEY,
  setThemeCookie,
  storeManualSeasonalTheme,
  THEME,
  useDarkmodeContext,
} from '@/context/ThemeContext'

export const useDarkMode = () => {
  const {
    setTheme,
    theme,
    seasonalThemeEnabled,
    setSeasonalThemeEnabled,
    manualSeasonalTheme,
    setManualSeasonalTheme,
  } = useDarkmodeContext()

  const persistManualSeasonalTheme = useCallback(
    (nextTheme: THEME | null) => {
      setManualSeasonalTheme(storeManualSeasonalTheme(nextTheme))
    },
    [setManualSeasonalTheme],
  )

  const setThemeMode = useCallback(
    (
      nextTheme: THEME,
      options?: {
        seasonalThemeEnabled?: boolean
        storeTheme?: boolean
        manualSeasonalTheme?: THEME | null
      },
    ) => {
      const nextSeasonalThemeEnabled =
        options?.seasonalThemeEnabled ?? isSeasonalTheme(nextTheme)
      const forceAutomaticSeason =
        !import.meta.env.DEV &&
        nextSeasonalThemeEnabled &&
        isSeasonalTheme(nextTheme)
      const appliedTheme = forceAutomaticSeason
        ? getAutomaticSeasonTheme()
        : nextTheme
      const nextManualSeasonalTheme = nextSeasonalThemeEnabled
        ? options?.manualSeasonalTheme === undefined
          ? manualSeasonalTheme
          : options.manualSeasonalTheme
        : null

      persistManualSeasonalTheme(nextManualSeasonalTheme)

      window.localStorage.setItem(
        SEASONAL_THEME_ENABLED_STORAGE_KEY,
        nextSeasonalThemeEnabled ? 'true' : 'false',
      )

      if (options?.storeTheme === false || forceAutomaticSeason) {
        window.localStorage.removeItem('theme')
      } else {
        window.localStorage.setItem('theme', appliedTheme)
      }

      setSeasonalThemeEnabled(nextSeasonalThemeEnabled)
      setThemeCookie(appliedTheme)
      setTheme(appliedTheme)
    },
    [
      manualSeasonalTheme,
      persistManualSeasonalTheme,
      setSeasonalThemeEnabled,
      setTheme,
    ],
  )

  const setAutomaticTheme = useCallback(() => {
    const nextTheme = getAutomaticSeasonTheme()
    setThemeMode(nextTheme, {
      seasonalThemeEnabled: true,
      storeTheme: false,
      manualSeasonalTheme: null,
    })
  }, [setThemeMode])

  const setManualSeasonalThemeMode = useCallback(
    (nextTheme: THEME) => {
      if (!isSeasonalTheme(nextTheme)) return
      if (!import.meta.env.DEV) {
        setAutomaticTheme()
        return
      }

      setThemeMode(nextTheme, {
        seasonalThemeEnabled: true,
        manualSeasonalTheme: nextTheme,
      })
    },
    [setAutomaticTheme, setThemeMode],
  )

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
        manualSeasonalTheme: null,
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
          ? (manualSeasonalTheme ?? getAutomaticSeasonTheme())
          : THEME.LIGHT
        : THEME.DARK

    setThemeMode(nextTheme, {
      seasonalThemeEnabled,
      storeTheme: !seasonalThemeEnabled || nextTheme === THEME.DARK,
    })
  }, [manualSeasonalTheme, seasonalThemeEnabled, setThemeMode, theme])

  return {
    toggleTheme,
    setThemeMode,
    setAutomaticTheme,
    setManualSeasonalThemeMode,
    seasonalThemeEnabled,
    toggleSeasonalTheme,
    setSeasonalThemeEnabledMode,
  }
}
