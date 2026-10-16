import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import {
  foldGutter,
  foldKeymap,
  indentOnInput,
  bracketMatching,
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import {
  keymap,
  dropCursor,
  EditorView,
  lineNumbers,
  drawSelection,
  crosshairCursor,
  highlightActiveLine,
  rectangularSelection,
  highlightSpecialChars,
  highlightActiveLineGutter,
} from '@codemirror/view'

import { runBench } from './harness'

// То же, что basicSetup из пакета codemirror (номера строк, сворачивание, история,
// поиск и замена, мультикурсор, подсветка скобок и совпадений), но без
// автодополнения: в IDE подсказки даст языковой сервер, а здесь сравниваем ядро.
// Плюс разбор TypeScript (Lezer).
const editorSetup = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
  ]),
  oneDark,
]

let view: EditorView | null = null

void runBench({
  mount: (element, text, jsx) => {
    view = new EditorView({
      doc: text,
      extensions: [editorSetup, javascript({ typescript: true, jsx })],
      parent: element,
    })
  },
  moveCursorTo: (fraction) => {
    const doc = view!.state.doc
    const line = doc.line(Math.max(1, Math.floor(doc.lines * fraction)))

    view!.dispatch({ selection: { anchor: line.to }, scrollIntoView: true })
  },
  moveCursorToEnd: () => {
    view!.dispatch({ selection: { anchor: view!.state.doc.length }, scrollIntoView: true })
  },
  focus: () => view!.focus(),
  length: () => view!.state.doc.length,
})
