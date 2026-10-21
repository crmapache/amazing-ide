/// <reference types="vite/client" />

// CSS Modules: имена классов приходят строками, а не известным заранее набором.
declare module '*.module.scss' {
  const classes: Readonly<Record<string, string>>
  export default classes
}

// Флаги сборки окна. VITE_SHOWCASE=1 включает витрину дизайн-системы в боевой
// сборке - так её видит копия окна агента (scripts/agent-window.sh). В релиз флаг
// не передаётся, и код витрины в бандл не попадает.
interface ImportMetaEnv {
  readonly VITE_SHOWCASE?: string
}

// Готовые конфигурации языков Monaco (комментарии, скобки, отступы) поставляются без
// типов. Редактор берёт из модуля только conf - подсветку даёт shiki (ADR 0018).
declare module 'monaco-editor/languages/definitions/*' {
  import type { languages } from 'monaco-editor/editor/editor.api.js'

  export const conf: languages.LanguageConfiguration
}
