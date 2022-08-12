import './modal.css'

import React from "react";

import { useDarkMode } from '../useDarkMode';
export const Modal = (props: any) => {
    const [themeMode, toggleTheme] = useDarkMode()
    const { open, close, header } = props;

    return (
        <div className={open ? 'openModal modal' : 'modal'}>
            {open ? (
                <section>
                    <header className={`${themeMode === 'dark' ? 'dark' : ''}`}>
                        Change Log  
                    </header>

                    <main className={`${themeMode === 'dark' ? 'dark' : ''}`}>{props.children}</main>
                    <footer className={`${themeMode === 'dark' ? 'dark' : ''}`}>
                        <button className='close' onClick={close}>
                            닫기
                        </button>
                    </footer>
                </section>
            ) : null}
        </div>
    )
}