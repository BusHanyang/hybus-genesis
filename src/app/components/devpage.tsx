import React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import { useDarkMode } from './useDarkMode'
const version = 'beta:0.0.1';

export const DevPage = () => {
  const [themeMode, toggleTheme] = useDarkMode()
  let textColor = '';
  let imageDir = '';
  if(useDarkMode()[0] === 'dark'){
    textColor = '#ffffff';
    imageDir = '../../image/github_light.png'
  } else {
    textColor = '#000000';
    imageDir = '../../image/github.png'
  }

  return (
    
        <>
        <div className='float-left p-20 w-full h-screen bg-cover'>
          <img className="bg-center m-auto pb-10" src="../../image/pwa-192x192.png" />
          <p className='text-center pb-5' style={{color: textColor}}>HYBUS</p>
          <p className='text-center pb-10' style={{color: textColor}}>Version {version}</p>
          <a href='https://github.com/BusHanyang/hybus-genesis'>
          <p className='float-right'>HYBUS GITHUB</p>
          <img className='bg-center m-auto' src={imageDir} />
          </a>

        </div>
        </>
  )
}
