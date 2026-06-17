import './index.css'
import './app/components/lang/i18n'

import { Partytown } from '@qwik.dev/partytown/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RecoilRoot } from 'recoil'

import SeasonalEffect from '@/components/seasonal/SeasonalEffect'
import { DarkmodeContextProvider } from '@/context/ThemeContext'
import { TimeTableContextProvider } from '@/context/TimeTableContext'

import App from './App'
// import { Ptr } from './app/components/ptr/Ptr'

const queryClient = new QueryClient()

const root = document.getElementById('root')

if (!root) throw new Error('Error! Cannot find root element')

root.classList.add('h-full')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <Partytown debug={false} forward={['dataLayer.push']} />
        <DarkmodeContextProvider>
          <SeasonalEffect />
          <TimeTableContextProvider>
            <App />
          </TimeTableContextProvider>
        </DarkmodeContextProvider>
      </RecoilRoot>
    </QueryClientProvider>
  </React.StrictMode>,
)
