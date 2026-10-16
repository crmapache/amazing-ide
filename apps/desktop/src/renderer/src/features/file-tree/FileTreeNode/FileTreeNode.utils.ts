import type { CSSProperties } from 'react'

/**
 * Отступ строки дерева задаётся глубиной через CSS-переменную --depth: сам расчёт
 * отступа живёт в стилях, из JS приходит только число.
 */
export const depthStyle = (depth: number) => ({ '--depth': depth }) as CSSProperties
