import { useHeadFile } from '../diff.queries'
import { useDocumentStatus } from '../editor.store'
import codeStyles from '../CodeEditor/CodeEditor.module.scss'
import { EditorContextMenu } from '../EditorContextMenu/EditorContextMenu'
import { useEditorContextMenu } from '../EditorContextMenu/EditorContextMenu.hooks'
import { DocumentNotice } from '../CodeEditor/parts/DocumentNotice'
import { useGitChanges } from '../../../state/git-changes.queries'
import { useDiffEditor } from './DiffEditor.hooks'
import styles from './DiffEditor.module.scss'
import type { DiffEditorProps } from './DiffEditor.types'
import { diffNotes, diffState, headPathOf, diffSummary, neighbourChanges } from './DiffEditor.utils'
import { DiffPlaceholder } from './parts/DiffPlaceholder'
import { DiffToolbar } from './parts/DiffToolbar'

/**
 * Разница файла с последним коммитом, как в WebStorm и Cursor: слева - файл в HEAD, справа -
 * он же на диске, правится и сохраняется сам, как в редакторе. Отдельный ленивый кусок, как
 * редактор (ADR 0005). Пока список изменений читается, разница ждёт: у переименованного
 * левая сторона лежит по другому пути.
 */
export const DiffEditor = ({ projectId, path, isActive }: DiffEditorProps) => {
  const changes = useGitChanges(projectId)
  // Список не прочитан или его нет (не git, git не ответил) - файл сравнивается как есть.
  const files = changes?.kind === 'listed' ? changes.files : undefined
  const change = files?.find((entry) => entry.path === path) ?? null
  const headPath = changes === undefined ? null : headPathOf(change, path)
  const head = useHeadFile(projectId, headPath)
  const status = useDocumentStatus(projectId, path)
  const needsDocument = change?.kind !== 'deleted'
  const state =
    changes === undefined
      ? ({ kind: 'loading' } as const)
      : diffState({ change, hasHead: headPath !== null, head, status })
  const { hostRef, probeRef, originalRef, modifiedRef, count, eolChanged, actions } = useDiffEditor(
    {
      projectId,
      path,
      isActive,
      needsDocument,
      state,
      // Файла нет на диске - открывать нечего: вкладка файла закрылась бы тут же.
      canOpen: needsDocument && status.kind !== 'missing',
    },
  )
  const originalMenu = useEditorContextMenu(originalRef, hostRef)
  const modifiedMenu = useEditorContextMenu(modifiedRef, hostRef)
  const notice = status.kind === 'text' ? status.notice : null
  const isReady = state.kind === 'ready'
  const summary = diffSummary({
    isCounting: state.kind === 'loading' || (isReady && count === null),
    count: isReady ? count : null,
    notes: isReady ? diffNotes({ change, head, status, eolChanged }) : [],
  })

  return (
    <div className={styles.diffEditor}>
      <DiffToolbar
        projectId={projectId}
        path={path}
        change={change}
        summary={summary}
        neighbours={neighbourChanges(files, path)}
        actions={actions}
      />
      {notice && <DocumentNotice projectId={projectId} path={path} notice={notice} />}
      <div className={styles.frame} hidden={!isReady}>
        <div ref={hostRef} className={styles.host} />
        <EditorContextMenu
          editorRef={originalRef}
          at={originalMenu.at}
          readOnly
          onClose={originalMenu.close}
        />
        <EditorContextMenu
          editorRef={modifiedRef}
          at={modifiedMenu.at}
          readOnly={isReady && state.readOnly}
          onClose={modifiedMenu.close}
        />
      </div>
      {(state.kind === 'headProblem' || state.kind === 'fileProblem') && (
        <DiffPlaceholder state={state} />
      )}
      <div ref={probeRef} className={codeStyles.scrollbarProbe} aria-hidden />
    </div>
  )
}
