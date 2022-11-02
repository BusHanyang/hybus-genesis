import { useCallback, useLayoutEffect } from 'react'

import { THEME, useDarkmodeContext } from '../context/ThemeContext'

export const useDarkMode = () => {
  const { setTheme, theme } = useDarkmodeContext()
  const BAR_STYLE = document.querySelector('meta[name=theme-color]')

  const setBarStyle = useCallback(
    (color: string) => {
      BAR_STYLE?.setAttribute('content', color)
    },
    [BAR_STYLE]
  )

  const setBackground = useCallback(() => {
    if (BAR_STYLE)
      theme === THEME.DARK ? setBarStyle('#27272A') : setBarStyle('#FFFFFF')

    if (theme === THEME.DARK) {
      document.body.style.backgroundColor = '#27272A'
    } else {
      document.body.style.backgroundColor = '#FFFFFF'
    }
  }, [BAR_STYLE, setBarStyle, theme])

  const toggleTheme = useCallback(() => {
    if (theme === THEME.LIGHT) {
      if (BAR_STYLE) BAR_STYLE.setAttribute('content', '#27272A')
      document.body.classList.add('dark')
      document.body.style.backgroundColor = '#27272A'
      window.localStorage.setItem('theme', THEME.DARK)
      setTheme(THEME.DARK)
    } else {
      if (BAR_STYLE) BAR_STYLE.setAttribute('content', '#FFFFFF')
      document.body.classList.remove('dark')
      document.body.style.backgroundColor = '#FFFFFF'
      window.localStorage.setItem('theme', THEME.LIGHT)
      setTheme(THEME.LIGHT)
    }
    // location.reload()
  }, [BAR_STYLE, setTheme, theme])

  useLayoutEffect(() => {
    const localTheme = window.localStorage.getItem('theme')
    if (localTheme) {
      setTheme(localTheme as THEME)
      setBackground()
    }
  }, [setBackground, setTheme])

  return { toggleTheme }
}
