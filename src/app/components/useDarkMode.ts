import { useCallback, useLayoutEffect } from 'react'

import {
  getAutomaticSeasonTheme,
  getResolvedTheme,
  getStoredManualSeasonalTheme,
  getStoredSeasonalThemeEnabled,
  isSeasonalTheme,
  MANUAL_SEASONAL_THEME_STORAGE_KEY,
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
  const {
    setTheme,
    theme,
    seasonalThemeEnabled,
    setSeasonalThemeEnabled,
    manualSeasonalTheme,
    setManualSeasonalTheme,
  } = useDarkmodeContext()
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

  const persistManualSeasonalTheme = useCallback(
    (nextTheme: THEME | null) => {
      const nextManualTheme =
        import.meta.env.DEV && isSeasonalTheme(nextTheme) ? nextTheme : null

      if (nextManualTheme === null) {
        window.localStorage.removeItem(MANUAL_SEASONAL_THEME_STORAGE_KEY)
      } else {
        window.localStorage.setItem(
          MANUAL_SEASONAL_THEME_STORAGE_KEY,
          nextManualTheme,
        )
      }

      setManualSeasonalTheme(nextManualTheme)
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
      setCookie('_theme', appliedTheme, 180)
      setTheme(appliedTheme)
      applyTheme(appliedTheme)
    },
    [
      applyTheme,
      manualSeasonalTheme,
      persistManualSeasonalTheme,
      setCookie,
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

  const setBackground = useCallback(() => {
    applyTheme(theme)
  }, [applyTheme, theme])

  useLayoutEffect(() => {
    const localTheme = window.localStorage.getItem('theme')
    const normalizedTheme = normalizeTheme(localTheme)
    const nextSeasonalThemeEnabled =
      getStoredSeasonalThemeEnabled(normalizedTheme)
    const nextManualSeasonalTheme = getStoredManualSeasonalTheme(
      normalizedTheme,
      nextSeasonalThemeEnabled,
    )
    const nextTheme = getResolvedTheme(
      normalizedTheme,
      nextSeasonalThemeEnabled,
      nextManualSeasonalTheme,
    )

    const storedSeasonalPreference = window.localStorage.getItem(
      SEASONAL_THEME_ENABLED_STORAGE_KEY,
    )
    const hasStoredSeasonalPreference =
      storedSeasonalPreference === 'true' ||
      storedSeasonalPreference === 'false'

    if (!hasStoredSeasonalPreference && isSeasonalTheme(normalizedTheme)) {
      window.localStorage.setItem(SEASONAL_THEME_ENABLED_STORAGE_KEY, 'true')
    }

    if (!import.meta.env.DEV && isSeasonalTheme(normalizedTheme)) {
      window.localStorage.removeItem('theme')
    } else if (localTheme === 'frozen') {
      window.localStorage.setItem('theme', nextTheme)
    }
    persistManualSeasonalTheme(nextManualSeasonalTheme)
    setSeasonalThemeEnabled(nextSeasonalThemeEnabled)
    setTheme(nextTheme)
    applyTheme(nextTheme)
    setCookie('_theme', nextTheme, 180)
  }, [
    applyTheme,
    persistManualSeasonalTheme,
    setCookie,
    setSeasonalThemeEnabled,
    setTheme,
  ])

  return {
    toggleTheme,
    setBackground,
    setThemeMode,
    setAutomaticTheme,
    setManualSeasonalThemeMode,
    seasonalThemeEnabled,
    toggleSeasonalTheme,
    setSeasonalThemeEnabledMode,
  }
}
