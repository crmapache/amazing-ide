import clsx from 'clsx'
import { File, Folder, ChevronRight } from 'lucide-react'

import { useIsExpanded, useFileTreeStore } from '../file-tree.store'
import { useSelectedFile, useSelectionStore } from '../../../state/selection.store'
import { TREE_ICON_SIZE, TREE_ICON_STROKE_WIDTH } from './FileTreeNode.constants'
import styles from './FileTreeNode.module.scss'
import type { FileTreeNodeProps } from './FileTreeNode.types'
import { depthStyle } from './FileTreeNode.utils'
import { DirectoryChildren } from './parts/DirectoryChildren'

/**
 * Строка дерева: папка раскрывается и сворачивается, файл выбирается и уходит в
 * редактор. Вложенное содержимое папки рисует DirectoryChildren - тот же узел
 * на уровень глубже.
 */
export const FileTreeNode = ({ projectId, entry, depth }: FileTreeNodeProps) => {
  const isDirectory = entry.kind === 'directory'
  const isExpanded = useIsExpanded(projectId, entry.relativePath)
  const isSelected = useSelectedFile(projectId) === entry.relativePath
  const toggleDirectory = useFileTreeStore((state) => state.toggleDirectory)
  const selectFile = useSelectionStore((state) => state.selectFile)

  const handleClick = () =>
    isDirectory
      ? toggleDirectory(projectId, entry.relativePath)
      : selectFile(projectId, entry.relativePath)

  return (
    <>
      <button
        type="button"
        aria-expanded={isDirectory ? isExpanded : undefined}
        className={clsx(styles.row, isSelected && styles.selected)}
        // eslint-disable-next-line no-restricted-syntax -- отступ зависит от глубины
        style={depthStyle(depth)}
        onClick={handleClick}>
        <ChevronRight
          size={TREE_ICON_SIZE}
          strokeWidth={TREE_ICON_STROKE_WIDTH}
          className={clsx(
            styles.chevron,
            isExpanded && styles.expanded,
            !isDirectory && styles.hidden,
          )}
          aria-hidden
        />
        {isDirectory ? (
          <Folder size={TREE_ICON_SIZE} strokeWidth={TREE_ICON_STROKE_WIDTH} aria-hidden />
        ) : (
          <File size={TREE_ICON_SIZE} strokeWidth={TREE_ICON_STROKE_WIDTH} aria-hidden />
        )}
        <span className={styles.name}>{entry.name}</span>
      </button>
      {isDirectory && isExpanded && (
        <DirectoryChildren
          projectId={projectId}
          relativePath={entry.relativePath}
          depth={depth + 1}
        />
      )}
    </>
  )
}
