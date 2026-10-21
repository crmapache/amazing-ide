import type * as Monaco from 'monaco-editor/editor/editor.api.js'

import { createLineHighlighter } from '../../lib/highlighter'
import { GRAMMARS } from '../../lib/syntax-grammars.constants'
import { LANGUAGE_CONFIGURATIONS } from './monaco-languages.constants'
import { toTokensProvider } from './monaco-languages.utils'

/**
 * Языки редактора - те же, что у подсветки блоков кода: id языка Monaco - имя грамматики
 * shiki. Подсветка и конфигурация (комментарии, скобки) грузятся при первом файле языка,
 * а не на старте: языков десятки, в проекте обычно пять.
 */
export const registerLanguages = (monaco: typeof Monaco) => {
  for (const id of Object.keys(GRAMMARS)) {
    monaco.languages.register({ id })
    monaco.languages.registerTokensProviderFactory(id, {
      create: async () => {
        const lines = await createLineHighlighter(id)

        return lines && toTokensProvider(lines)
      },
    })

    const configuration = LANGUAGE_CONFIGURATIONS[id]

    if (!configuration) continue

    monaco.languages.onLanguageEncountered(id, () => {
      configuration()
        .then(({ conf }) => monaco.languages.setLanguageConfiguration(id, conf))
        .catch((error: unknown) =>
          console.warn(`[editor] конфигурация ${id} не загрузилась:`, error),
        )
    })
  }
}
