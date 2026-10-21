import { useEffect } from 'react'

import { invoke } from '../../lib/ipc'
import { useIpcEvent } from '../../lib/ipc.hooks'
import { heldPaths, guardDiscard, useDiscardGuard } from '../../state/discard-guard.store'
import { activeTab } from '../../state/editor-tabs.utils'
import { useLayoutStore } from '../../state/layout.store'
import { useSelectionStore } from '../../state/selection.store'
import { useActiveProject } from '../../state/workspace.queries'
import { editorDocuments } from './editor-bus'
import { requestCloseTabs } from './editor-close'
import { usePreviewImageSync } from './markdown-preview.queries'

const saveAll = () => editorDocuments()?.saveAll() ?? Promise.resolve()

/**
 * Выход из IDE: дописать всё и ответить главному процессу, сколько файлов сохранить
 * нельзя. Есть такие - выход отменяется, а человека спрашивают; согласие выходит заново.
 */
const answerQuit = async () => {
  await saveAll()

  const held = heldPaths()

  await invoke('editor:savedAll', { unsaved: held.length })
  guardDiscard('quit', held, () => {
    useDiscardGuard.getState().allowUnload()
    void invoke('editor:allowQuit', { quit: true })
  })
}

/**
 * Закрыть окно или перезагрузить его с несохранённым нельзя молча: правки живут только в
 * окне. Electron отменяет закрытие, если страница его не отпустила; человек отвечает на
 * вопрос, и согласие закрывает окно.
 */
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  const held = heldPaths()

  if (held.length === 0 || useDiscardGuard.getState().unloadAllowed) return

  event.preventDefault()
  guardDiscard('window', held, () => {
    useDiscardGuard.getState().allowUnload()
    window.close()
  })
}

/**
 * Редактор и главный процесс: изменения на диске - открытым файлам и картинкам
 * просмотра Markdown, ⌘W из меню - закрыть активную вкладку (если файл сейчас виден),
 * выход из IDE - дописать всё и ответить. Уход из окна пишет файлы сразу, как в
 * WebStorm, а возврат сверяет их с диском. Подключается один раз, в корне окна.
 */
export const useEditorSync = () => {
  const project = useActiveProject()

  useIpcEvent('fs:changed', (change) => editorDocuments()?.diskChanged(change))
  usePreviewImageSync()

  useIpcEvent('editor:command', (command) => {
    if (command === 'saveAll') return void answerQuit()

    const { main } = useLayoutStore.getState()
    const active = project && activeTab(useSelectionStore.getState().tabsByProject[project.id])

    if (project && active && main.isOpen && main.activeViewId === 'file') {
      requestCloseTabs(project.id, [active])
    }
  })

  useEffect(() => {
    const handleLeave = () => void saveAll()

    const handleReturn = () => editorDocuments()?.checkAll()

    window.addEventListener('blur', handleLeave)
    window.addEventListener('focus', handleReturn)
    window.addEventListener('pagehide', handleLeave)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('blur', handleLeave)
      window.removeEventListener('focus', handleReturn)
      window.removeEventListener('pagehide', handleLeave)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])
}
