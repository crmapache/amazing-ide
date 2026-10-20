import { useMemo, useState, useEffect } from 'react'
import type { ThemedToken } from 'shiki/core'

import { highlightCode } from '../highlighter'
import { useKnownFiles } from '../paths.hooks'
import { HIGHLIGHT_DELAY_MS } from './CodeBlock.constants'
import styles from './CodeBlock.module.scss'
import type { CodeRun } from './CodeBlock.types'
import { plainRuns, findCodePaths, highlightedRuns } from './CodeBlock.utils'

/**
 * Код по строкам с подсветкой. Пока текст растёт (ответ печатается), подсветка ждёт
 * паузы: красить каждую букву заново дорого, а глаз всё равно читает уже готовое.
 * Ответ на устаревший код отбрасывается.
 */
const useHighlightedLines = (code: string, language: string) => {
  const [highlighted, setHighlighted] = useState<{ code: string; lines: ThemedToken[][] } | null>(
    null,
  )

  useEffect(() => {
    if (!language) return

    let isCurrent = true
    const timer = window.setTimeout(() => {
      highlightCode(code, language)
        .then((lines) => {
          if (isCurrent && lines) setHighlighted({ code, lines })
        })
        .catch((error: unknown) => console.warn('[claude-code] подсветка не удалась:', error))
    }, HIGHLIGHT_DELAY_MS)

    return () => {
      isCurrent = false
      window.clearTimeout(timer)
    }
  }, [code, language])

  return highlighted?.code === code ? highlighted.lines : null
}

/**
 * Код к отрисовке по строкам: строки подсветки, разрезанные по путям к файлам, - путь в
 * блоке кода открывается так же, как в тексте. Пока подсветки нет (или язык неизвестен),
 * весь код - одна «строка» ровного цвета, тоже с путями.
 */
export const useCodeRuns = (code: string, language: string): CodeRun[][] => {
  const known = useKnownFiles()
  const lines = useHighlightedLines(code, language)
  const paths = useMemo(() => findCodePaths(code, known), [code, known])

  return useMemo(
    () => (lines ? highlightedRuns(lines, paths, styles) : [plainRuns(code, paths)]),
    [code, lines, paths],
  )
}
