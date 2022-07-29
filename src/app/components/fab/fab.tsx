import 'react-tiny-fab/dist/styles.css';

import React from 'react'
import { useNavigate } from 'react-router-dom';
import { Action,Fab} from 'react-tiny-fab';

import { useDarkMode } from '../useDarkMode';
export const Fabs = () => {

  const navigate = useNavigate();
  
  const [themeMode, toggleTheme] = useDarkMode()

  let changeText = '';
  let changeColor = '';
  let iconColor = '';

    const handleEmailOnClick = (): Promise<React.FC> => {
        return new Promise((res) => {
          console.log("성공");
        })
      }
      const handleDevOnClick = (): Promise<React.FC> => {
        return new Promise((res) => {
          navigate('/devpage');
        })
      }
      const handleDarkOnClick = (): Promise<React.FC> => {
        return new Promise((res) => {
          toggleTheme()
        })
      }
      if(useDarkMode()[0] === 'dark'){
        changeText = '라이트모드';
        changeColor = '#374151';
        iconColor = 'white';
      } else {  
        changeText = '다크모드'
        changeColor = '#ffffff'
        iconColor = 'black';
      }
  return (
    <Fab
    icon={'+'}
    mainButtonStyles={{backgroundColor:'#7099C1'}}
    style={{bottom:100, right:12}}
    alwaysShowTitle={true}
    >
  <Action
    text= {changeText}
    style={{backgroundColor: changeColor, color: iconColor}}
    onClick={handleDarkOnClick}
  >4</Action>
  <Action
    text="개발자 정보"
    style={{backgroundColor: changeColor, color: iconColor}}
    onClick={handleDevOnClick}
  >3</Action>
  <Action
    text="후원하기"
    style={{backgroundColor: changeColor, color: iconColor}}
    onClick={handleEmailOnClick}
  >2</Action>
  <Action
    text="문의하기"
    style={{backgroundColor: changeColor, color: iconColor}}
    onClick={handleEmailOnClick}
  >1</Action>
</Fab>
  )
}
