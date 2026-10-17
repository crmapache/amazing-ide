import type en from './en.json'
import type showcaseEn from './showcase.en.json'

// Ключи переводов проверяет компилятор: t('опечатка') не соберётся. showcase -
// отдельное пространство витрины дизайн-системы: подгружается вместе с ней и в
// релизную сборку не попадает (features/showcase/showcase.i18n.ts).
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof en; showcase: typeof showcaseEn }
  }
}
