import { useEffect } from 'react'

import { useLayoutStore } from '../../state/layout.store'
import { useSelectionStore } from '../../state/selection.store'

/**
 * Показать вид «файл» в середине. Уже показанный не трогаем: повторный выбор вида
 * свернул бы середину.
 */
const showFileView = () => {
  const { main, selectMainView } = useLayoutStore.getState()

  if (main.activeViewId !== 'file' || !main.isOpen) selectMainView('file')
}

/**
 * Выбрал файл - середина окна разворачивается и показывает вид «файл», какой бы вид в
 * ней ни стоял: иначе клик в дереве, найденное поиском и путь из ленты Claude Code
 * молча ушли бы за сценарии, статистику или свёрнутую середину. Ловит каждый выбор, и
 * повторный того же файла: стор выбора на каждый выбор заводит новый словарь.
 */
export const useFileViewOnSelect = () => {
  useEffect(
    () =>
      useSelectionStore.subscribe((state, previous) => {
        if (state.selectedFileByProject !== previous.selectedFileByProject) showFileView()
      }),
    [],
  )
}
