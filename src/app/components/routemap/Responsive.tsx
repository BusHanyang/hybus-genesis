import React, { useEffect } from 'react'

const useResponsive = () => {
  const [screenWidth, setScreenWidth] = React.useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return screenWidth
}

export default useResponsive
