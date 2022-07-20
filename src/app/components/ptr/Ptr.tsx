import React from 'react'
import PullToRefresh from 'react-simple-pull-to-refresh'

import App from '../../../App'
import { useDarkMode } from '../useDarkMode'
import Refreshing from './refreshing-content'

const colorDarkMod = '#27272a' //bg-zinc-800

export const Ptr = () => {
  let dark = false
  let color = 'white'

  if(useDarkMode()[0] === 'dark'){
    dark = true
    color = colorDarkMod
  }
  
  const handleRefresh = (): Promise<React.FC> => {
    return new Promise((res) => {
      location.reload()
    })
  }

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      backgroundColor={color}
      pullingContent=""
      refreshingContent={<Refreshing mode={dark} />}
    >
      <App />
    </PullToRefresh>
  )
}