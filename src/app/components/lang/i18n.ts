import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

import langEN from './lang.en.json'
import langKO from './lang.ko.json'

const resources = {
  ko: {
    translation: langKO,
  },
  en: {
    translation: langEN,
  },
}

declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false
  }
}

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: "ko", // 강제기본값
    fallbackLng: 'ko',
    returnNull: false,
    debug: false,
    resources,
    //ns: ['translation'],
    detection: { 
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['cookie', 'localStorage']
    },
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  })

i18n.on('languageChanged', (lng) => {
  document.documentElement.setAttribute('language', lng)
})

export default i18n
