import { memo } from 'react'

import styles from '../MarkdownPreview.module.scss'
import type { PreviewCodeProps } from '../MarkdownPreview.types'
import { useHighlightedLines } from '../../../../lib/highlighter.hooks'
import { tokenClassName } from '../../../../lib/syntax-classes.utils'

/**
 * Блок кода просмотра: подсветка теми же грамматиками и ролями, что в редакторе и в
 * ленте Claude Code. Язык неизвестен (mermaid, свой) - код ровным цветом.
 */
export const PreviewCode = memo(({ code, language }: PreviewCodeProps) => {
  const lines = useHighlightedLines(code, language)

  return (
    <pre className={styles.codeBlock}>
      <code className={styles.code}>
        {lines
          ? lines.map((line, index) => (
              <span key={index} className={styles.line}>
                {line.map((token, column) => (
                  <span key={column} className={tokenClassName(token, styles)}>
                    {token.content}
                  </span>
                ))}
              </span>
            ))
          : code}
      </code>
    </pre>
  )
})

PreviewCode.displayName = 'PreviewCode'
