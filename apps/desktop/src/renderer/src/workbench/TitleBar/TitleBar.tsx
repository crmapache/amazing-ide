import { Suspense } from 'react'
import { Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@amazing-ide/ui/IconButton'

import { useIdeActions } from '../actions/ide-actions'
import { useOpenFile } from '../actions/open-file'
import { ShowcaseToggle } from '../views/showcase-view'
import { useActiveProject } from '../../state/workspace.queries'
import { BranchSwitcher } from '../../features/git/BranchSwitcher/BranchSwitcher'
import { ProjectSwitcher } from '../../features/projects/ProjectSwitcher/ProjectSwitcher'
import { SearchEverywhere } from '../../features/search-everywhere/SearchEverywhere/SearchEverywhere'
import styles from './TitleBar.module.scss'

/**
 * Шапка окна, как в WebStorm: слева проект и ветка, справа поиск везде и настройки
 * (в dev - ещё витрина дизайн-системы). Окно таскают за пустые места - место под
 * «светофор» и распорку между группами; кнопки в область перетаскивания не попадают.
 */
export const TitleBar = () => {
  const { t } = useTranslation()
  const project = useActiveProject()
  const actions = useIdeActions()
  const openFile = useOpenFile()

  return (
    <header className={styles.titleBar}>
      <div className={styles.trafficLights} />
      <div className={styles.start}>
        <ProjectSwitcher />
        <BranchSwitcher />
      </div>
      <div className={styles.dragSpace} />
      <div className={styles.end}>
        {ShowcaseToggle && (
          <Suspense fallback={null}>
            <ShowcaseToggle />
          </Suspense>
        )}
        <SearchEverywhere projectId={project?.id} actions={actions} onOpenFile={openFile} />
        <IconButton icon={Settings} label={t('titleBar.settingsSoon')} disabled />
      </div>
    </header>
  )
}
