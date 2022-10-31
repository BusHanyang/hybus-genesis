import { useCallback, useEffect } from 'react'

import { THEME, useDarkmodeContext } from '../context/ThemeContext'

export const useDarkMode = () => {
  const { setTheme, theme } = useDarkmodeContext()
  const toggleTheme = useCallback(() => {
    if (theme === THEME.LIGHT) {
      window.localStorage.setItem('theme', THEME.DARK)
      setTheme(THEME.DARK)
    } else {
      window.localStorage.setItem('theme', THEME.LIGHT)
      setTheme(THEME.LIGHT)
    }
    // location.reload()
  }, [setTheme, theme])

  useEffect(() => {
    const localTheme = window.localStorage.getItem('theme')
    if (localTheme) {
      setTheme(localTheme as THEME)
    }
  }, [setTheme])

  return { toggleTheme }
}
