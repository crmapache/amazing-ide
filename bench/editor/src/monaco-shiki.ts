import * as monaco from 'monaco-editor/editor/editor.api.js'
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker'
import { conf } from 'monaco-editor/languages/definitions/typescript/typescript.js'

import 'monaco-editor/features/register.all.js'

import { createLineHighlighter } from '../../../apps/desktop/src/renderer/src/lib/highlighter'
import { toTokensProvider } from '../../../apps/desktop/src/renderer/src/features/editor/monaco-languages.utils'
import { THEME_ROLES } from '../../../apps/desktop/src/renderer/src/features/editor/monaco-theme.constants'
import type { ThemeColors } from '../../../apps/desktop/src/renderer/src/features/editor/monaco-theme.types'
import { tokenRules } from '../../../apps/desktop/src/renderer/src/features/editor/monaco-theme.utils'
import { runBench } from './harness'

// Monaco как в IDE (ADR 0018): те же функции правки, что в варианте monaco, но подсветка -
// грамматиками TextMate через shiki, тем же кодом, что в окне IDE (lib/highlighter и
// адаптер features/editor). Сравнение с вариантом monaco показывает цену TextMate против
// Monarch на вводе.
;(self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
}

const GREY = { r: 200, g: 200, b: 200, a: 1 }
const colors = Object.fromEntries(Object.keys(THEME_ROLES).map((key) => [key, GREY])) as ThemeColors

monaco.editor.defineTheme('bench', {
  base: 'vs-dark',
  inherit: true,
  rules: tokenRules(colors),
  colors: {},
})

for (const id of ['typescript', 'tsx']) {
  monaco.languages.register({ id })
  monaco.languages.setLanguageConfiguration(id, conf)
  monaco.languages.registerTokensProviderFactory(id, {
    create: async () => {
      const lines = await createLineHighlighter(id)

      return lines && toTokensProvider(lines)
    },
  })
}

let editor: monaco.editor.IStandaloneCodeEditor | null = null

void runBench({
  mount: async (element, text, jsx) => {
    // Грамматика грузится заранее, как в IDE к моменту, когда файл показан.
    await createLineHighlighter(jsx ? 'tsx' : 'typescript')
    editor = monaco.editor.create(element, {
      value: text,
      language: jsx ? 'tsx' : 'typescript',
      theme: 'bench',
      minimap: { enabled: false },
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      wordBasedSuggestions: 'off',
      parameterHints: { enabled: false },
      automaticLayout: false,
    })
  },
  moveCursorTo: (fraction) => {
    const model = editor!.getModel()!
    const line = Math.max(1, Math.floor(model.getLineCount() * fraction))

    editor!.setPosition({ lineNumber: line, column: model.getLineMaxColumn(line) })
    editor!.revealLineInCenter(line)
  },
  moveCursorToEnd: () => {
    const model = editor!.getModel()!
    const line = model.getLineCount()

    editor!.setPosition({ lineNumber: line, column: model.getLineMaxColumn(line) })
    editor!.revealLine(line)
  },
  focus: () => editor!.focus(),
  length: () => editor!.getModel()!.getValueLength(),
})
