import './index.css'
import './app/components/lang/i18n'

import { Partytown } from '@qwik.dev/partytown/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'

import SeasonalEffect from '@/components/seasonal/SeasonalEffect'
import { DarkmodeContextProvider } from '@/context/ThemeContext'

import App from './App'
// import { Ptr } from './app/components/ptr/Ptr'

const queryClient = new QueryClient()

const root = document.getElementById('root')

if (!root) throw new Error('Error! Cannot find root element')

root.classList.add('h-full')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Partytown debug={false} />
      <DarkmodeContextProvider>
        <SeasonalEffect />
        <App />
      </DarkmodeContextProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
