import * as monaco from 'monaco-editor/editor/editor.api.js'
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker'

import 'monaco-editor/features/register.all.js'
import 'monaco-editor/languages/definitions/typescript/register.js'

import { runBench } from './harness'

// Облегчённый Monaco: все функции правки VS Code (поиск, сворачивание, мультикурсор,
// контекстное меню, diff) и подсветка TypeScript (Monarch), но без встроенного
// языкового сервиса TypeScript - подсказки в IDE пойдут через LSP в любом движке.
// Миникарта и автодополнение выключены: у CodeMirror в стенде их нет, а подсказки
// в IDE даст языковой сервер. Сравниваем ядро.
;(self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
}

let editor: monaco.editor.IStandaloneCodeEditor | null = null

void runBench({
  mount: (element, text) => {
    editor = monaco.editor.create(element, {
      value: text,
      language: 'typescript',
      theme: 'vs-dark',
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
