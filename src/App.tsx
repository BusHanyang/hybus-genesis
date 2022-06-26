import './App.css'

import React, { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { Card } from './app/components'
import logo from './logo.svg'

function App() {
  const [count, setCount] = useState(0)

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      // eslint-disable-next-line prefer-template
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error)
    },
  })

  return (
    <div className="App">
      <Card season="semester" week="week" location="yesulin" expanded={false} />
    </div>
  )
}

export default App
