import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '../locales/en.json'

/**
 * Переводы интерфейса. Пока один язык; новый - это файл в locales/ с теми же
 * ключами и строка в resources. Строки прямо в JSX запрещает линтер.
 */
void i18next.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
  returnNull: false,
})
