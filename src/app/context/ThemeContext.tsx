import React from 'react'

export const enum THEME {
  LIGHT = 'light',
  DARK = 'dark',
  CHRISTMAS = 'christmas',
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
  const themeName = window.localStorage.getItem('theme') as THEME || THEME.LIGHT
  const [theme, setTheme] = React.useState<THEME>(themeName)

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
