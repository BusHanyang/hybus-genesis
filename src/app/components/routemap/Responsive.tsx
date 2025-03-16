import React, { useEffect } from 'react'

const Responsive = () => {
  const [screenWidth, setScreenWidth] = React.useState(window.innerWidth)

  useEffect(() => {
    window.addEventListener('resize', () => setScreenWidth(window.innerWidth))

    return () => {
      window.removeEventListener('resize', () =>
        setScreenWidth(window.innerWidth),
      )
    }
  }, [])
  return { screenWidth }
}

export default Responsive
