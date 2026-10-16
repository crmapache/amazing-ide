import { useTranslation } from 'react-i18next'

import { FileTreeNode } from '../FileTreeNode'
import styles from '../FileTreeNode.module.scss'
import type { DirectoryChildrenProps } from '../FileTreeNode.types'
import { depthStyle } from '../FileTreeNode.utils'
import { useDirectory } from '../../file-tree.queries'

/**
 * Содержимое раскрытой папки. Читается с диска только когда папку раскрыли.
 * Пустая папка и ошибка чтения показываются строкой на месте содержимого.
 */
export const DirectoryChildren = ({ projectId, relativePath, depth }: DirectoryChildrenProps) => {
  const { t } = useTranslation()
  const { data, isError } = useDirectory(projectId, relativePath)

  if (isError || data?.length === 0) {
    return (
      // eslint-disable-next-line no-restricted-syntax -- отступ зависит от глубины
      <div className={styles.note} style={depthStyle(depth)}>
        {isError ? t('fileTree.readError') : t('fileTree.emptyFolder')}
      </div>
    )
  }

  return data?.map((entry) => (
    <FileTreeNode key={entry.relativePath} projectId={projectId} entry={entry} depth={depth} />
  ))
}
