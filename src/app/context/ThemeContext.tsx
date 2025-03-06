import React from 'react'

export enum THEME {
  LIGHT = 'light',
  DARK = 'dark',
  CHRISTMAS = 'christmas',
  SPRING = 'spring',
}

interface ThemeContextProps {
  theme: THEME
  setTheme: React.Dispatch<React.SetStateAction<THEME>>
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
  const themeName = 
    Object
      .values(THEME)
      .includes(window.localStorage.getItem('theme') as THEME) 
    ? window.localStorage.getItem('theme') as THEME : THEME.LIGHT
  const [theme, setTheme] = React.useState<THEME>(themeName)

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
