import type { editor } from 'monaco-editor/editor/editor.api.js'

import { MONACO_FIND_COMMANDS } from './editor.constants'
import { useEditorStore } from './editor.store'
import { monaco } from './monaco-setup'
import { editorTypography } from './monaco-theme'

type Editor = editor.IStandaloneCodeEditor

/**
 * Общее у редактора файла и сторон разницы: Monaco настраивается одинаково, где бы код ни
 * стоял. Здесь - то, что делается с готовым экземпляром.
 */

/** Палитра команд Monaco строится из этого списка: без поиска, его панели в IDE нет. */
export const hideFindFromPalette = (instance: Editor) => {
  const supportedActions = instance.getSupportedActions.bind(instance)

  instance.getSupportedActions = () =>
    supportedActions().filter((action) => !MONACO_FIND_COMMANDS.has(action.id))
}

/**
 * Просьба отдать клавиатуру - редактору активной вкладки: фокус и то, что просили сделать
 * следом (⌘Z вне кода - отмена в нём, editor-sync.hooks.ts).
 */
export const takeFocus = (instance: Editor | null) => {
  const then = useEditorStore.getState().focusThen

  instance?.focus()
  if (then) instance?.trigger('keyboard', then, null)
}

/**
 * Шрифт кода подгружается, когда им впервые пишут, а Monaco меряет буквы при создании:
 * без перемера после загрузки курсор встал бы мимо букв.
 */
export const remeasureWhenLoaded = () => {
  const { fontFamily, fontSize } = editorTypography()

  void document.fonts
    .load(`${fontSize}px ${fontFamily}`)
    .then(() => monaco.editor.remeasureFonts())
    .catch(() => undefined)
}
