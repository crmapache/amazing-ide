/// <reference types="vite/client" />

// CSS Modules: имена классов приходят строками, а не известным заранее набором.
declare module '*.module.scss' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
