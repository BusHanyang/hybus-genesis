import React from 'react'

export const enum THEME {
  LIGHT = 'light',
  DARK = 'dark',
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
  const [theme, setTheme] = React.useState<THEME>(THEME.LIGHT)

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
