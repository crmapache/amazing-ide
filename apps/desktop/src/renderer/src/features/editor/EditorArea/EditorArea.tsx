import { FileCode, FolderOpen, MousePointerClick } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@amazing-ide/ui/Button'
import { EmptyState } from '@amazing-ide/ui/EmptyState'

import { useSelectedFile } from '../../../state/selection.store'
import { useActiveProject, useWorkspaceActions } from '../../../state/workspace.queries'
import styles from './EditorArea.module.scss'

/**
 * Зона 6: выбранный файл. Пока заглушка - показывает, какой файл выбран; сюда
 * встанет полноценный редактор (движок выбирается отдельным ADR).
 */
export const EditorArea = () => {
  const { t } = useTranslation()
  const project = useActiveProject()
  const selectedFile = useSelectedFile(project?.id)
  const { openProject } = useWorkspaceActions()

  if (!project) {
    return (
      <EmptyState
        icon={FolderOpen}
        title={t('editor.noProjectTitle')}
        description={t('editor.noProjectText')}
        action={
          <Button variant="primary" onClick={openProject}>
            {t('projects.open')}
          </Button>
        }
      />
    )
  }

  if (!selectedFile) {
    return (
      <EmptyState
        icon={MousePointerClick}
        title={t('editor.noFileTitle')}
        description={t('editor.noFileText')}
      />
    )
  }

  return (
    <div className={styles.editorArea}>
      <div className={styles.fileHeader}>{selectedFile}</div>
      <EmptyState icon={FileCode} title={selectedFile} description={t('editor.stub')} />
    </div>
  )
}
