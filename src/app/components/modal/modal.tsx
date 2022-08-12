import './modal.css'

import React from "react";
import { useTranslation } from 'react-i18next'

import { useDarkMode } from '../useDarkMode';
export const Modal = (props: any) => {
    const [themeMode, toggleTheme] = useDarkMode()
    const { open, close, header } = props;
    const { t } = useTranslation()
    let dataTheme = "";
    if(useDarkMode()[0] === 'dark'){
        dataTheme = "dark";
    } else {
        dataTheme = "white";
    }

    return (
        <div className={open ? 'openModal modal' : 'modal'}>
            {open ? (
                <section>
                    <header data-theme={dataTheme}>
                        {t('changelog')}
                    </header>

                    <main data-theme={dataTheme}>{props.children}</main>
                    <footer data-theme={dataTheme}>
                        <button className='close' onClick={close}>
                            닫기
                        </button>
                    </footer>
                </section>
            ) : null}
        </div>
    )
}