import React from 'react'

export enum THEME {
  LIGHT = 'light',
  DARK = 'dark',
  CHRISTMAS = 'christmas',
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter',
}

export const themeValues = Object.values(THEME)
export const seasonalThemeValues = [
  THEME.CHRISTMAS,
  THEME.SPRING,
  THEME.SUMMER,
  THEME.AUTUMN,
  THEME.WINTER,
]
export const SEASONAL_THEME_ENABLED_STORAGE_KEY = 'seasonalThemeEnabled'
export const MANUAL_SEASONAL_THEME_STORAGE_KEY = 'manualSeasonalTheme'

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000
const KOREA_UTC_OFFSET_IN_MILLISECONDS = 9 * 60 * 60 * 1000
const SEASON_REFRESH_GRACE_PERIOD_IN_MILLISECONDS = 100

const getMillisecondsUntilNextKoreaMidnight = (now = Date.now()): number => {
  const koreaNow = now + KOREA_UTC_OFFSET_IN_MILLISECONDS
  const nextKoreaDay =
    (Math.floor(koreaNow / DAY_IN_MILLISECONDS) + 1) * DAY_IN_MILLISECONDS

  return nextKoreaDay - koreaNow + SEASON_REFRESH_GRACE_PERIOD_IN_MILLISECONDS
}

const getKoreaMonthDay = (date: Date): number => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
  })
  const parts = formatter.formatToParts(date)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)

  return month * 100 + day
}

export const getAutomaticSeasonTheme = (date = new Date()): THEME => {
  const monthDay = getKoreaMonthDay(date)

  if (monthDay >= 1215 && monthDay <= 1226) return THEME.CHRISTMAS
  if (monthDay >= 1124 || monthDay < 312) return THEME.WINTER
  if (monthDay >= 926) return THEME.AUTUMN
  if (monthDay >= 608) return THEME.SUMMER

  return THEME.SPRING
}

export const normalizeTheme = (themeName: string | null): THEME | null => {
  if (themeName === 'frozen') return THEME.WINTER
  if (themeValues.includes(themeName as THEME)) return themeName as THEME

  return null
}

export const isSeasonalTheme = (themeName: THEME | null): boolean =>
  themeName !== null && seasonalThemeValues.includes(themeName)

export const getStoredSeasonalThemeEnabled = (
  storedTheme: THEME | null,
): boolean => {
  const storedValue = window.localStorage.getItem(
    SEASONAL_THEME_ENABLED_STORAGE_KEY,
  )

  if (storedValue === 'true') return true
  if (storedValue === 'false') return false

  return isSeasonalTheme(storedTheme)
}

export const getStoredManualSeasonalTheme = (
  storedTheme: THEME | null,
  seasonalThemeEnabled: boolean,
): THEME | null => {
  if (!import.meta.env.DEV || !seasonalThemeEnabled) return null

  const storedManualTheme = normalizeTheme(
    window.localStorage.getItem(MANUAL_SEASONAL_THEME_STORAGE_KEY),
  )

  if (isSeasonalTheme(storedManualTheme)) return storedManualTheme
  if (isSeasonalTheme(storedTheme)) return storedTheme

  return null
}

export const getResolvedTheme = (
  storedTheme: THEME | null,
  seasonalThemeEnabled: boolean,
  manualSeasonalTheme: THEME | null = null,
): THEME => {
  if (storedTheme === THEME.DARK) return THEME.DARK
  if (seasonalThemeEnabled) {
    if (manualSeasonalTheme !== null && isSeasonalTheme(manualSeasonalTheme)) {
      return manualSeasonalTheme
    }

    return getAutomaticSeasonTheme()
  }

  return THEME.LIGHT
}

export const setThemeCookie = (theme: THEME) => {
  const expires = new Date(Date.now() + 180 * DAY_IN_MILLISECONDS)
  document.cookie = `_theme=${theme}; expires=${expires.toUTCString()}; path=/; domain=hybus.app;`
}

export const storeManualSeasonalTheme = (theme: THEME | null): THEME | null => {
  const manualTheme =
    import.meta.env.DEV && isSeasonalTheme(theme) ? theme : null

  if (manualTheme === null) {
    window.localStorage.removeItem(MANUAL_SEASONAL_THEME_STORAGE_KEY)
  } else {
    window.localStorage.setItem(MANUAL_SEASONAL_THEME_STORAGE_KEY, manualTheme)
  }

  return manualTheme
}

const applyTheme = (theme: THEME) => {
  const body = document.body
  body.classList.add('transition-colors')
  body.classList.remove(...themeValues, 'frozen')
  body.classList.add(theme)
  document
    .querySelector('meta[name=theme-color]')
    ?.setAttribute(
      'content',
      getComputedStyle(body).getPropertyValue('--color-theme-main').trim(),
    )
}

const migrateStoredTheme = () => {
  const localTheme = window.localStorage.getItem('theme')
  const normalizedTheme = normalizeTheme(localTheme)
  const seasonalThemeEnabled = getStoredSeasonalThemeEnabled(normalizedTheme)
  const manualSeasonalTheme = getStoredManualSeasonalTheme(
    normalizedTheme,
    seasonalThemeEnabled,
  )
  const theme = getResolvedTheme(
    normalizedTheme,
    seasonalThemeEnabled,
    manualSeasonalTheme,
  )

  const storedSeasonalPreference = window.localStorage.getItem(
    SEASONAL_THEME_ENABLED_STORAGE_KEY,
  )
  const hasStoredSeasonalPreference =
    storedSeasonalPreference === 'true' || storedSeasonalPreference === 'false'

  if (!hasStoredSeasonalPreference && isSeasonalTheme(normalizedTheme)) {
    window.localStorage.setItem(SEASONAL_THEME_ENABLED_STORAGE_KEY, 'true')
  }

  if (!import.meta.env.DEV && isSeasonalTheme(normalizedTheme)) {
    window.localStorage.removeItem('theme')
  } else if (localTheme === 'frozen') {
    window.localStorage.setItem('theme', theme)
  }
  storeManualSeasonalTheme(manualSeasonalTheme)
  setThemeCookie(theme)
}

interface ThemeContextProps {
  theme: THEME
  setTheme: React.Dispatch<React.SetStateAction<THEME>>
  automaticSeasonTheme: THEME
  seasonalThemeEnabled: boolean
  setSeasonalThemeEnabled: React.Dispatch<React.SetStateAction<boolean>>
  manualSeasonalTheme: THEME | null
  setManualSeasonalTheme: React.Dispatch<React.SetStateAction<THEME | null>>
}

const ThemeContext = React.createContext<ThemeContextProps | null>(null)

export const useDarkmodeContext = () => {
  const context = React.useContext(ThemeContext)
  if (!context) throw Error('Theme provider not defined!')
  return context
}

export const DarkmodeContextProvider = ({
  children,
}: React.PropsWithChildren) => {
  const storedTheme = normalizeTheme(window.localStorage.getItem('theme'))
  const storedSeasonalThemeEnabled = getStoredSeasonalThemeEnabled(storedTheme)
  const storedManualSeasonalTheme = getStoredManualSeasonalTheme(
    storedTheme,
    storedSeasonalThemeEnabled,
  )
  const themeName = getResolvedTheme(
    storedTheme,
    storedSeasonalThemeEnabled,
    storedManualSeasonalTheme,
  )
  const [theme, setTheme] = React.useState<THEME>(themeName)
  const [automaticSeasonTheme, setAutomaticSeasonTheme] = React.useState<THEME>(
    () => getAutomaticSeasonTheme(),
  )
  const [seasonalThemeEnabled, setSeasonalThemeEnabled] =
    React.useState<boolean>(storedSeasonalThemeEnabled)
  const [manualSeasonalTheme, setManualSeasonalTheme] =
    React.useState<THEME | null>(storedManualSeasonalTheme)

  React.useLayoutEffect(() => {
    migrateStoredTheme()
  }, [])

  React.useLayoutEffect(() => {
    applyTheme(theme)
  }, [theme])

  React.useEffect(() => {
    let refreshTimer: number | null = null

    const clearRefreshTimer = () => {
      if (refreshTimer === null) return
      window.clearTimeout(refreshTimer)
      refreshTimer = null
    }

    const refreshAutomaticSeason = () => {
      setAutomaticSeasonTheme(getAutomaticSeasonTheme())
    }

    const scheduleNextRefresh = () => {
      clearRefreshTimer()
      refreshTimer = window.setTimeout(() => {
        refreshAutomaticSeason()
        scheduleNextRefresh()
      }, getMillisecondsUntilNextKoreaMidnight())
    }

    const refreshAfterResume = () => {
      refreshAutomaticSeason()
      scheduleNextRefresh()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshAfterResume()
    }

    scheduleNextRefresh()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', refreshAfterResume)

    return () => {
      clearRefreshTimer()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', refreshAfterResume)
    }
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        automaticSeasonTheme,
        seasonalThemeEnabled,
        setSeasonalThemeEnabled,
        manualSeasonalTheme,
        setManualSeasonalTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
