import { Search, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@amazing-ide/ui/IconButton'

import { useLayoutStore } from '../../state/layout.store'
import { BranchSwitcher } from '../../features/git/BranchSwitcher/BranchSwitcher'
import { ProjectSwitcher } from '../../features/projects/ProjectSwitcher/ProjectSwitcher'
import styles from './TitleBar.module.scss'

/**
 * Шапка окна, как в WebStorm: слева проект и ветка, справа поиск и настройки. За
 * пустые места шапки окно таскают; кнопки из этой области исключает base.css.
 */
export const TitleBar = () => {
  const { t } = useTranslation()
  const showSideView = useLayoutStore((state) => state.showSideView)

  return (
    <header className={styles.titleBar}>
      <div className={styles.start}>
        <ProjectSwitcher />
        <BranchSwitcher />
      </div>
      <div className={styles.end}>
        <IconButton
          icon={Search}
          label={t('titleBar.search')}
          onClick={() => showSideView('search')}
        />
        <IconButton icon={Settings} label={t('titleBar.settingsSoon')} disabled />
      </div>
    </header>
  )
}
