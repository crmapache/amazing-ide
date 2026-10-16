import { useTranslation } from 'react-i18next'

import { useAppInfo } from '../../../state/app-info.queries'
import { useSelectedFile } from '../../../state/selection.store'
import { useActiveProject } from '../../../state/workspace.queries'
import styles from './StatusBar.module.scss'

/** Зона 4: строка состояния. Слева - путь открытого файла, справа - версия IDE. */
export const StatusBar = () => {
  const { t } = useTranslation()
  const project = useActiveProject()
  const selectedFile = useSelectedFile(project?.id)
  const { data: appInfo } = useAppInfo()
  const path = project && selectedFile ? `${project.name}/${selectedFile}` : project?.name

  return (
    <footer className={styles.statusBar}>
      <span className={styles.path}>{path}</span>
      {appInfo && (
        <span className={styles.version}>
          {t('statusBar.version', { version: appInfo.version })}
        </span>
      )}
    </footer>
  )
}
