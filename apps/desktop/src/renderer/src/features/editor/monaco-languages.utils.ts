import type { StateStack } from 'shiki/textmate'
import type { languages } from 'monaco-editor/editor/editor.api.js'

import type { LineHighlighter } from '../../lib/highlighter.types'

/**
 * Имя токена для темы Monaco: роль цвета и начертание TextMate (`token-keyword.fs1` -
 * ключевое слово курсивом). Тема (monaco-theme.utils) заводит правило на каждое такое
 * имя. Слова comment и string в имени Monaco читает сам: внутри них не закрывает скобки.
 */
export const tokenScope = (role: string, fontStyle: number): string =>
  fontStyle > 0 ? `${role}.fs${fontStyle}` : role

/**
 * Состояние строки для Monaco - стек правил грамматики. Стек неизменяемый, поэтому
 * копия - он сам. Равенство - по содержимому: Monaco по нему понимает, что правка не
 * изменила конец строки, и не перекрашивает файл до конца.
 */
class LineState implements languages.IState {
  constructor(readonly stack: StateStack) {}

  clone(): LineState {
    return this
  }

  equals(other: languages.IState): boolean {
    return (
      other instanceof LineState && (other.stack === this.stack || other.stack.equals(this.stack))
    )
  }
}

/** Подсветка shiki в виде, который понимает Monaco: строка за строкой, со стеком. */
export const toTokensProvider = (lines: LineHighlighter): languages.TokensProvider => ({
  getInitialState: () => new LineState(lines.initial),
  tokenize: (line, state) => {
    const { tokens, state: next } = lines.tokenizeLine(line, (state as LineState).stack)

    return {
      tokens: tokens.map((token) => ({
        startIndex: token.start,
        scopes: tokenScope(token.role, token.fontStyle),
      })),
      endState: new LineState(next),
    }
  },
})
