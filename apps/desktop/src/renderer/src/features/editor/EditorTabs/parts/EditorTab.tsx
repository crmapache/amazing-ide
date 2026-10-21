import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { ClosableTab } from '@amazing-ide/ui/ClosableTab'
import { FileIcon } from '@amazing-ide/ui/FileIcon'
import { openWhenReleased } from '@amazing-ide/ui/Popover.utils'

import type { EditorTabProps } from '../EditorTabs.types'
import { requestCloseTabs } from '../../editor-close'
import { useDocumentNotice } from '../../editor.store'
import { useEditorStore } from '../../editor.store'
import { useSelectionStore } from '../../../../state/selection.store'

/**
 * Вкладка файла: иконка типа, имя (у одноимённых - с папкой), полный путь в подсказке,
 * крестик и средняя кнопка мыши закрывают, правая кнопка - меню. Файл с вопросом
 * (конфликт с диском, не записался) светится цветом внимания, пока вопрос не решён.
 */
export const EditorTab = ({ projectId, path, label, isActive, onMenu }: EditorTabProps) => {
  const { t } = useTranslation()
  const selectFile = useSelectionStore((state) => state.selectFile)
  const requestFocus = useEditorStore((state) => state.requestFocus)
  const notice = useDocumentNotice(projectId, path)

  // Выбрал вкладку мышью - пишешь в этот файл: клавиатура уходит в редактор, как в WebStorm.
  const handleActivate = () => {
    selectFile(projectId, path)
    requestFocus()
  }

  const handleClose = () => requestCloseTabs(projectId, [path])

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = event.currentTarget

    event.preventDefault()
    openWhenReleased(event.nativeEvent, () => onMenu(path, anchor))
  }

  return (
    <ClosableTab
      width="fit"
      label={label}
      hint={path}
      active={isActive}
      closeLabel={t('editor.tabs.close', { name: label })}
      leading={<FileIcon path={path} kind="file" size="sm" />}
      call={notice ? 'attention' : null}
      calm
      onContextMenu={handleContextMenu}
      onActivate={handleActivate}
      onClose={handleClose}
    />
  )
}
