import { useTranslation } from 'react-i18next'

import { FileTreeNode } from '../FileTreeNode'
import styles from '../FileTreeNode.module.scss'
import type { DirectoryChildrenProps } from '../FileTreeNode.types'
import { depthStyle } from '../FileTreeNode.utils'
import { useDirectory } from '../../file-tree.queries'

/**
 * Содержимое раскрытой папки. Читается с диска только когда папку раскрыли.
 * Пустая папка и ошибка чтения показываются строкой на месте содержимого. Ошибка
 * перечитывания при прочитанном раньше содержимом - не повод его прятать: так бывает,
 * когда папку удалили и строка вот-вот пропадёт вместе с ней. Кроме корня: его строки
 * нет, и пропасть вместе с ней он не может.
 */
export const DirectoryChildren = ({ projectId, relativePath, depth }: DirectoryChildrenProps) => {
  const { t } = useTranslation()
  const { data, isError } = useDirectory(projectId, relativePath)

  // У корня строки над ним нет: пропал сам проект (удалили, отключили диск) - сказать.
  const showError = isError && (!data || relativePath === '')

  if (showError || data?.length === 0) {
    return (
      // eslint-disable-next-line no-restricted-syntax -- отступ зависит от глубины
      <div className={styles.note} style={depthStyle(depth)}>
        {showError ? t('fileTree.readError') : t('fileTree.emptyFolder')}
      </div>
    )
  }

  return data?.map((entry) => (
    <FileTreeNode key={entry.relativePath} projectId={projectId} entry={entry} depth={depth} />
  ))
}
