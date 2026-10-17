import type { CSSProperties } from 'react'

/**
 * Образец токена в витрине: CSS-переменная образца ссылается на токен по имени.
 * Стиль образца читает её с запасным значением, поэтому имена токенов живут в
 * данных витрины, а не в тридцати классах.
 */
export const tokenSample = (variable: `--${string}`, token: string) =>
  ({ [variable]: `var(${token})` }) as CSSProperties
