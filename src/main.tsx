import './index.css'
import './app/components/lang/i18n'

import { Partytown } from '@builder.io/partytown/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Snowfall } from 'react-snowfall'
import { RecoilRoot } from 'recoil'

import { DarkmodeContextProvider } from '@/context/ThemeContext'
import { TimeTableContextProvider } from '@/context/TimeTableContext'

import App from './App'
// import { Ptr } from './app/components/ptr/Ptr'

const queryClient = new QueryClient()

const root = document.getElementById('root')

if (!root) throw new Error('Error! Cannot find root element')

root.classList.add('h-full')

const snowflake1 = document.createElement('img')
const snowflake2 = document.createElement('img')
snowflake1.src = '/image/flower_pink.png'
snowflake2.src = '/image/flower_bpink.png'
const flakes = [snowflake1, snowflake2]

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <Partytown debug={false} forward={['dataLayer.push']} />
        <DarkmodeContextProvider>
          <Snowfall
            //color={'#B4CCCF'}
            images={flakes}
            snowflakeCount={28}
            wind={[-0.5, 0.5]}
            radius={[14.0, 16.0]}
            style={{
              zIndex: 2,
              position: 'fixed',
              height: '100vh',
              pointerEvents: 'none',
            }}
          />
          <TimeTableContextProvider>
            <App />
          </TimeTableContextProvider>
        </DarkmodeContextProvider>
      </RecoilRoot>
    </QueryClientProvider>
  </React.StrictMode>,
)
