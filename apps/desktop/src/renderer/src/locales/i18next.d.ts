import type en from './en.json'

// Ключи переводов проверяет компилятор: t('опечатка') не соберётся.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof en }
  }
}
