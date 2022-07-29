import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import langEN from "./lang.en";
import langKO from "./lang.ko";

const resources = {
    en: {
        translation: langEN,
    },
    ko: {
        translation: langKO,
    }
}

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "en",
    })

export default i18n