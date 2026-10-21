import { guardDiscard } from '../../state/discard-guard.store'
import { useSelectionStore } from '../../state/selection.store'
import { editorDocuments } from './editor-bus'

/**
 * Закрыть вкладки файлов: обычные закрываются сразу (несохранённое дописывается само),
 * а если среди них есть вкладка с вопросом (конфликт, удалён, не записался, файл за
 * проектом) - сначала спросить человека. Один путь для крестика, меню вкладки и ⌘W.
 */
export const requestCloseTabs = (projectId: string, paths: readonly string[]) => {
  const { heldByProject, closeTabs } = useSelectionStore.getState()
  const held = paths.filter((path) => heldByProject[projectId]?.includes(path))

  guardDiscard('tabs', held, () => {
    editorDocuments()?.discard(projectId, held)
    closeTabs(projectId, paths)
  })
}
