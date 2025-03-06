import { useCallback, useLayoutEffect } from 'react'

import { THEME, useDarkmodeContext } from '@/context/ThemeContext'

export const useDarkMode = () => {
  const { setTheme, theme } = useDarkmodeContext()
  const BAR_STYLE = document.querySelector('meta[name=theme-color]')

  const setCookie = (
    cookieName: string,
    cookieValue: string,
    validDay: number
  ) => {
    const d = new Date()
    d.setTime(d.getTime() + validDay * (24 * 60 * 60 * 1000))

    const expires = `expires=${d.toUTCString()}`
    document.cookie = `${cookieName}=${cookieValue}; ${expires}; path=/; domain=hybus.app;`
  }

  const setBarStyle = useCallback(
    (color: string) => {
      BAR_STYLE?.setAttribute('content', color)
    },
    [BAR_STYLE]
  )

  const setBackground = useCallback(() => {
    if (theme === THEME.DARK) {
      document.body.style.backgroundColor = '#27272A'
      if (BAR_STYLE) setBarStyle('#27272A')
    } else if (theme === THEME.CHRISTMAS) {
      document.body.style.backgroundColor = '#b23e3e'
      if (BAR_STYLE) setBarStyle('#b23e3e')
    } else if (theme === THEME.SPRING) {
      document.body.style.backgroundColor = '#fff4f4'
      if (BAR_STYLE) setBarStyle('#fff4f4')
    } else {
      document.body.style.backgroundColor = '#FFFFFF'
      if (BAR_STYLE) setBarStyle('#FFFFFF')
    }
    //theme === THEME.DARK ? setBarStyle('#27272A') : setBarStyle('#FFFFFF')
    //document.body.style.backgroundColor = 'var(--color-theme-main)'
  }, [BAR_STYLE, setBarStyle, theme])


  const toggleTheme = useCallback(() => {
    document.body.classList.add('transition-colors')
    document.body.style.backgroundColor = 'var(--color-theme-main)'

    if (theme === THEME.LIGHT) {
      if (BAR_STYLE) BAR_STYLE.setAttribute('content', '#27272A')
      document.body.classList.add('dark')
      document.body.style.backgroundColor = '#27272A'
      window.localStorage.setItem('theme', THEME.DARK)
      setCookie('_theme', THEME.DARK, 180)
      setTheme(THEME.DARK)
    } else if (theme === THEME.DARK) {
      //if (BAR_STYLE) BAR_STYLE.setAttribute('content', '#b23e3e')
      if (BAR_STYLE) BAR_STYLE.setAttribute('content', '#fff4f4')
      document.body.style.backgroundColor = '#fff4f4'
      //document.body.classList.add('christmas')
      document.body.classList.add('spring')
      //document.body.classList.add('dark')
      window.localStorage.setItem('theme', THEME.SPRING)
      setCookie('_theme', THEME.SPRING, 180)
      setTheme(THEME.SPRING) 
    } else {
      // Change to Light Mode (Default)
      if (BAR_STYLE) BAR_STYLE.setAttribute('content', '#FFFFFF')
      document.body.classList.remove('dark')
      document.body.classList.remove('christmas')
      document.body.classList.remove('spring')
      //document.body.style.backgroundColor = '#FFFFFF'
      window.localStorage.setItem('theme', THEME.LIGHT)
      setCookie('_theme', THEME.LIGHT, 180)
      setTheme(THEME.LIGHT)
    }
    // location.reload()
  }, [BAR_STYLE, setTheme, theme])

  useLayoutEffect(() => {
    const localTheme = window.localStorage.getItem('theme')
    if (localTheme) {
      setTheme(localTheme as THEME)
      setBackground()
      setCookie('_theme', localTheme, 180)
    } else {
      setCookie('_theme', THEME.LIGHT, 180)
    }
  }, [setBackground, setTheme])

  return { toggleTheme, setBackground }
}
