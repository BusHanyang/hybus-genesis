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
  if (monthDay >= 1107 || monthDay < 204) return THEME.WINTER
  if (monthDay >= 807) return THEME.AUTUMN
  if (monthDay >= 505) return THEME.SUMMER

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

interface ThemeContextProps {
  theme: THEME
  setTheme: React.Dispatch<React.SetStateAction<THEME>>
  automaticSeasonTheme: THEME
  seasonalThemeEnabled: boolean
  setSeasonalThemeEnabled: React.Dispatch<React.SetStateAction<boolean>>
  manualSeasonalTheme: THEME | null
  setManualSeasonalTheme: React.Dispatch<React.SetStateAction<THEME | null>>
  seasonalThemePreview: boolean
  setSeasonalThemePreview: React.Dispatch<React.SetStateAction<boolean>>
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
  const [seasonalThemePreview, setSeasonalThemePreview] =
    React.useState<boolean>(false)

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
        seasonalThemePreview,
        setSeasonalThemePreview,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
