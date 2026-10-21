import type { StateStack } from 'shiki/textmate'

/**
 * Кусок строки одной роли: с какого символа, роль цвета (`token-keyword`, `foreground`)
 * и начертание битовой маской TextMate (1 - курсив, 2 - жирный, 4 - подчёркнутый).
 */
export type LineToken = { start: number; role: string; fontStyle: number }

/**
 * Подсветка языка по строкам - для редактора, который красит файл строка за строкой и
 * после правки перекрашивает только то, что поменялось. Состояние - стек правил
 * грамматики в конце строки: с ним разбирается следующая.
 */
export type LineHighlighter = {
  initial: StateStack
  tokenizeLine: (line: string, state: StateStack) => { tokens: LineToken[]; state: StateStack }
}
