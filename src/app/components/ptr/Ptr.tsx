import React from 'react'
import PullToRefresh from 'react-simple-pull-to-refresh'

import App from '../../../App'
import Refreshing from './refreshing-content'

const dark = true

const colorDarkMod = '#27272a' //bg-zinc-800

export const Ptr = () => {
  let color = 'white'

  if (dark) {
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