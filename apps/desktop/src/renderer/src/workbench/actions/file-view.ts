import { useEffect } from 'react'

import { isMainShown, useLayoutStore } from '../../state/layout.store'
import { useSelectionStore } from '../../state/selection.store'

/**
 * Показать вид «файл» в середине. Уже показанный не трогаем: повторный выбор вида
 * свернул бы середину. Свёрнутую за нехваткой места выбор разворачивает, ужимая панели.
 */
const showFileView = () => {
  const state = useLayoutStore.getState()

  if (state.main.activeViewId !== 'file' || !isMainShown(state)) state.selectMainView('file')
}

/**
 * Выбрал файл - середина окна разворачивается и показывает вид «файл», какой бы вид в
 * ней ни стоял: иначе клик в дереве, найденное поиском и путь из ленты Claude Code
 * молча ушли бы за сценарии, статистику или свёрнутую середину. Ловит каждый выбор, и
 * повторный того же файла (счётчик выбора растёт на каждый), но не закрытие вкладки:
 * оно ничего не открывает.
 */
export const useFileViewOnSelect = () => {
  useEffect(
    () =>
      useSelectionStore.subscribe((state, previous) => {
        if (state.selectSerial !== previous.selectSerial) showFileView()
      }),
    [],
  )
}
