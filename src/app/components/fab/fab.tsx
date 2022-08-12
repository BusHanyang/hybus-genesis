import 'react-tiny-fab/dist/styles.css';
import './fab.css'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom';
import { Action,Fab } from 'react-tiny-fab';

import Arrow from '/image/add_white_48dp.svg'
import DarkImg from '/image/dark_mode_black_48dp.svg'
import Email from '/image/email_black_48dp.svg'
import Info from '/image/infoblack.svg'
import LightImg from '/image/light_mode_black_48dp.svg'
import Support from '/image/local_cafe_black_48dp.svg'

import { Modal } from "../modal/modal";
import { useDarkMode } from '../useDarkMode';
export const Fabs = () => {

  const navigate = useNavigate();
  
  const [themeMode, toggleTheme] = useDarkMode()
  const [isHovering, setIsHovering] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const { t } = useTranslation()


    const openModal = () => {
      setModalOpen(true);
  };
  const closeModal = () => {
      setModalOpen(false);
  };

  let changeText = '';
  let changeColor = '';
  let iconColor = '';
  let dataTheme = '';
  let imgIcon = '';
    const handleEmailOnClick = (): Promise<React.FC> => {
        return new Promise((res) => {
          window.location.href = "mailto:admin@hybus.app";
        })
      }
      const handleDonateOnClick = (): Promise<React.FC> => {
        return new Promise((res) => {
          window.location.href = "https://www.buymeacoffee.com/hybus";
        })
      }
      // const handleDevOnClick = (): Promise<React.FC> => {
      //   return new Promise((res) => {
      //     navigate('/devpage');
      //   })
      // }
      const handleDarkOnClick = (): Promise<React.FC> => {
        return new Promise((res) => {
          toggleTheme()
        })
      }
      if(useDarkMode()[0] === 'dark'){
        changeText = t('light');
        changeColor = '#374151';
        iconColor = 'white';
        dataTheme = "dark";
        imgIcon = LightImg;
      } else {  
        changeText = t('dark')
        changeColor = '#ffffff'
        iconColor = 'black';
        dataTheme = 'white';
        imgIcon = DarkImg;
      }
  return (
      <><div className='font-Ptd'><Fab
      icon={<img className='iconImg' src={Arrow} data-theme={dataTheme}></img>}
      mainButtonStyles={{ backgroundColor: '#7099C1', fontSize: "10px" }}
      style={{ bottom: "1.25rem", right: "1.25rem", margin: "0px", padding: "0px"}}
      alwaysShowTitle={true}
    >
      <Action
        text={changeText}
        style={{ backgroundColor: changeColor, color: iconColor}}
        onClick={handleDarkOnClick}
      ><div className='icons'><img src={imgIcon} style={{ padding: 8 }} data-theme={dataTheme} /></div></Action>
      <Action
        text={t('changelog')}
        style={{ backgroundColor: changeColor, color: iconColor }}
        onClick={openModal}
      ><div className='icons'><img src={Info} style={{ padding: 8 }} data-theme={dataTheme} /></div></Action>
      <Action
        text={t('donate')}
        style={{ backgroundColor: changeColor, color: iconColor }}
        onClick={handleDonateOnClick}
      ><div className='icons'><img src={Support} style={{ padding: 8 }} data-theme={dataTheme} /></div></Action>
      <Action
        text={t('ask')}
        style={{ backgroundColor: changeColor, color: iconColor }}
        onClick={handleEmailOnClick}
      ><div className='icons'><img src={Email} style={{ padding: 8 }} data-theme={dataTheme} /></div></Action>
    </Fab></div><React.Fragment>
        <Modal open={modalOpen} close={closeModal} header="Modal heading">
          <div className='font-Ptd'>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          <p>2021.08.?? ✏️ 알파버젼 출시</p>
          </div>
         
        </Modal>
      </React.Fragment></>
  )
}
