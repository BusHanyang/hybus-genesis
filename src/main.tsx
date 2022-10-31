import './index.css'
import './New.css'
import './app/components/lang/i18n'

import { Partytown } from '@builder.io/partytown/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { RecoilRoot } from 'recoil'

import App from './App'
// import { Ptr } from './app/components/ptr/Ptr'

const queryClient = new QueryClient()

const root = document.getElementById('root')

if (!root) throw new Error('Error! Cannot find root element')

root.classList.add('h-full')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <RecoilRoot>
        <Partytown debug={false} forward={['dataLayer.push']} />
        <App />
      </RecoilRoot>
    </QueryClientProvider>
  </React.StrictMode>
)
