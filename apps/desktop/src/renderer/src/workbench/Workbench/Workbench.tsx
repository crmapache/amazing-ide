import { useTranslation } from 'react-i18next'

import { ActivityBar } from '../ActivityBar/ActivityBar'
import { NotificationArea } from '../NotificationArea/NotificationArea'
import { SidePanel } from '../SidePanel/SidePanel'
import { TitleBar } from '../TitleBar/TitleBar'
import { PROVIDER_VIEWS } from '../views/provider-views'
import { SIDE_VIEWS } from '../views/side-views'
import { useLayoutStore } from '../../state/layout.store'
import { EditorArea } from '../../features/editor/EditorArea/EditorArea'
import { GitNotice } from '../../features/git/GitNotice/GitNotice'
import { ProjectTabs } from '../../features/projects/ProjectTabs/ProjectTabs'
import { StatusBar } from '../../features/status-bar/StatusBar/StatusBar'
import { UpdateNotice } from '../../features/updates/UpdateNotice/UpdateNotice'
import styles from './Workbench.module.scss'

/**
 * Раскладка окна IDE (docs/architecture.md): 1 шапка (проект, ветка, поиск,
 * настройки) и под ней вкладки проектов, 2 и 3 полосы переключения видов, 4 строка
 * состояния, 5 левая панель, 6 редактор, 7 GUI провайдера LLM. Workbench только
 * расставляет зоны и связывает их с раскладкой; что внутри каждой - решают фичи.
 */
export const Workbench = () => {
  const { t } = useTranslation()
  const side = useLayoutStore((state) => state.side)
  const provider = useLayoutStore((state) => state.provider)
  const selectSideView = useLayoutStore((state) => state.selectSideView)
  const selectProviderView = useLayoutStore((state) => state.selectProviderView)
  const resizePanel = useLayoutStore((state) => state.resizePanel)

  return (
    <div className={styles.workbench}>
      <TitleBar />
      <ProjectTabs />

      <div className={styles.body}>
        <ActivityBar
          edge="start"
          label={t('sideViews.label')}
          views={SIDE_VIEWS}
          activeViewId={side.activeViewId}
          isPanelOpen={side.isOpen}
          onSelect={selectSideView}
        />
        <SidePanel
          placement="start"
          views={SIDE_VIEWS}
          activeViewId={side.activeViewId}
          isOpen={side.isOpen}
          width={side.width}
          resizeLabel={t('sideViews.resize')}
          onResize={(delta) => resizePanel('side', delta)}
        />

        <main className={styles.editor}>
          <EditorArea />
        </main>

        <SidePanel
          placement="end"
          views={PROVIDER_VIEWS}
          activeViewId={provider.activeViewId}
          isOpen={provider.isOpen}
          width={provider.width}
          resizeLabel={t('providerViews.resize')}
          onResize={(delta) => resizePanel('provider', delta)}
        />
        <ActivityBar
          edge="end"
          label={t('providerViews.label')}
          views={PROVIDER_VIEWS}
          activeViewId={provider.activeViewId}
          isPanelOpen={provider.isOpen}
          onSelect={selectProviderView}
        />
      </div>

      <StatusBar />

      <NotificationArea>
        <UpdateNotice />
        <GitNotice />
      </NotificationArea>
    </div>
  )
}
