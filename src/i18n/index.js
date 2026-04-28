import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import fr from './locales/fr.json'
import zh from './locales/zh.json'
import en from './locales/en.json'
import es from './locales/es.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      zh: { translation: zh },
      en: { translation: en },
      es: { translation: es },
    },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'lang',
      caches: ['localStorage'],
    },
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  })

export default i18n
