import { Suspense } from 'react'
import { FolderOpen, MousePointerClick } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@amazing-ide/ui/Button'
import { EmptyState } from '@amazing-ide/ui/EmptyState'

import { EditorTabs } from '../EditorTabs/EditorTabs'
import { useEditorTabs, useSelectedFile, useSelectedPlace } from '../../../state/selection.store'
import { useActiveProject, useWorkspaceActions } from '../../../state/workspace.queries'
import { CodeEditor } from './EditorArea.constants'
import styles from './EditorArea.module.scss'

/**
 * Зона 6, вид «файл»: вкладки открытых файлов проекта и редактор активной, у файла
 * Markdown - и просмотр. Без проекта - приглашение открыть, без вкладок -
 * выбрать файл в дереве.
 */
export const EditorArea = () => {
  const { t } = useTranslation()
  const project = useActiveProject()
  const tabs = useEditorTabs(project?.id)
  const selectedFile = useSelectedFile(project?.id)
  const place = useSelectedPlace(project?.id)
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
      <EditorTabs projectId={project.id} paths={tabs} active={selectedFile} />
      <Suspense fallback={null}>
        <CodeEditor projectId={project.id} path={selectedFile} place={place} />
      </Suspense>
    </div>
  )
}
