import { useState, useEffect } from 'react'
import type { ThemedToken } from 'shiki/core'

import { highlightCode } from './highlighter'
import { HIGHLIGHT_DELAY_MS } from './highlighter.constants'

/**
 * Код по строкам с подсветкой. Пока текст растёт (ответ печатается, человек правит
 * файл), подсветка ждёт паузы `delayMs`: красить каждую букву заново дорого, а глаз всё
 * равно читает уже готовое. Ответ на устаревший код отбрасывается. null - подсветки ещё
 * нет или язык неизвестен: код показывается ровным цветом.
 */
export const useHighlightedLines = (
  code: string,
  language: string,
  delayMs = HIGHLIGHT_DELAY_MS,
): ThemedToken[][] | null => {
  const [highlighted, setHighlighted] = useState<{
    code: string
    language: string
    lines: ThemedToken[][]
  } | null>(null)

  useEffect(() => {
    if (!language) return

    let isCurrent = true
    const timer = window.setTimeout(() => {
      highlightCode(code, language)
        .then((lines) => {
          if (isCurrent && lines) setHighlighted({ code, language, lines })
        })
        .catch((error: unknown) => console.warn('[highlighter] подсветка не удалась:', error))
    }, delayMs)

    return () => {
      isCurrent = false
      window.clearTimeout(timer)
    }
  }, [code, language, delayMs])

  // Подсветка - для этого кода на этом языке: сменили язык блока - прежняя не годится.
  return highlighted?.code === code && highlighted.language === language ? highlighted.lines : null
}
