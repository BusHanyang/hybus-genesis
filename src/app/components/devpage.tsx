
import React, { useEffect, useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'

import { useDarkMode } from './useDarkMode'
const version = 'beta:0.0.1';

export const DevPage = () => {
  const [themeMode, toggleTheme] = useDarkMode()
  let textColor = '';
  let imageDir = '';
  let bgColor = '';
  if(useDarkMode()[0] === 'dark'){
    textColor = '#ffffff';
    imageDir = '../../image/github_light.png'
  } else {
    textColor = '#000000';
    imageDir = '../../image/github.png'
    bgColor = 'bg-white'
  }

  return (
    
        <>
        <div className={'float-left p-10 w-full h-screen bg-cover ' + bgColor}>
          <img className="bg-cent er m-auto pb-10" src="../../image/pwa-192x192.png" />
          <p className='text-center pb-5' style={{color: textColor}}>HYBUS</p>
          <p className='text-center pb-10' style={{color: textColor}}>Version {version}</p>
          <a href='https://github.com/BusHanyang'>
          <img className='bg-center m-auto' src={imageDir} />

          </a>
            {/* <h1 className='text-4xl font-BHS'>개발자</h1> */}
          {/* <div className='m-auto flex flex-col space-y-20'>

          <div className='m-auto md:flex md:flex-row flex flex-col space-y-20 md:space-y-0 md:space-x-4'>
            <div className='basis-1/2 flex flex-row'>
              <img className='w-24 h-50 mr-8 basis-1/2' src={"../../image/devlTae.png"} />
              <div className='flex flex-col basis-1/2'>
                <p className='whitespace-nowrap font-BHS text-xl' style={{color: textColor}}>이재형</p>
                <p className='indent-3'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero et aperiam quibusdam rerum ipsa vitae laborum omnis pariatur deleniti, officia distinctio quod expedita, rem excepturi minima neque, a quidem explicabo?</p>
              </div>
            </div>
            <div className='basis-1/2 flex flex-row'>
              <img className='w-24 h-50 mr-8 basis-1/2' src={"../../image/devlTae.png"} />
              <div className='flex flex-col basis-1/2'>
                <p className='whitespace-nowrap font-BHS text-xl' style={{color: textColor}}>김철연</p>
                <p className='indent-3'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero et aperiam quibusdam rerum ipsa vitae laborum omnis pariatur deleniti, officia distinctio quod expedita, rem excepturi minima neque, a quidem explicabo?</p>
              </div>
            </div>
          </div>

          <div className='m-auto md:flex md:flex-row flex flex-col space-y-20 md:space-y-0 md:space-x-4'>
            <div className='basis-1/2 flex flex-row'>
              <img className='w-24 h-50 mr-8 basis-1/2' src={"../../image/devlTae.png"} />
              <div className='flex flex-col basis-1/2'>
                <p className='whitespace-nowrap font-BHS text-xl' style={{color: textColor}}>박유선</p>
                <p className='indent-3'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero et aperiam quibusdam rerum ipsa vitae laborum omnis pariatur deleniti, officia distinctio quod expedita, rem excepturi minima neque, a quidem explicabo?</p>
              </div>
            </div>
            <div className='basis-1/2 flex flex-row'>
              <img className='w-24 h-50 mr-8 basis-1/2' src={"../../image/devlTae.png"} />
              <div className='flex flex-col basis-1/2'>
                <p className='whitespace-nowrap font-BHS text-xl' style={{color: textColor}}>박태완</p>
                <p className='indent-3'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero et aperiam quibusdam rerum ipsa vitae laborum omnis pariatur deleniti, officia distinctio quod expedita, rem excepturi minima neque, a quidem explicabo?</p>
              </div>
            </div>
          </div>


          <div className='m-auto md:flex md:flex-row flex flex-col space-y-20 md:space-y-0 md:space-x-4'>
            <div className='basis-1/2 flex flex-row'>
              <img className='w-24 h-50 mr-8 basis-1/2' src={"../../image/devlTae.png"} />
              <div className='flex flex-col basis-1/2'>
                <p className='whitespace-nowrap font-BHS text-xl' style={{color: textColor}}>이형창</p>
                <p className='indent-3'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero et aperiam quibusdam rerum ipsa vitae laborum omnis pariatur deleniti, officia distinctio quod expedita, rem excepturi minima neque, a quidem explicabo?</p>
              </div>
            </div>
          </div>

          </div> */}

          

        </div>
        </>
  )
}
