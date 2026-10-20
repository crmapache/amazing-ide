import { Suspense } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

import { useClaudePanelKey, useClaudePanelToggle } from '../actions/claude-panel'
import { useFileViewOnSelect } from '../actions/file-view'
import { useOpenFile } from '../actions/open-file'
import { ActivityBar } from '../ActivityBar/ActivityBar'
import { NotificationArea } from '../NotificationArea/NotificationArea'
import { SearchLayer } from '../SearchLayer/SearchLayer'
import { SidePanel } from '../SidePanel/SidePanel'
import { TitleBar } from '../TitleBar/TitleBar'
import { MAIN_VIEWS } from '../views/main-views'
import { PROVIDER_VIEWS } from '../views/provider-views'
import { ShowcaseLayer } from '../views/showcase-view'
import { SIDE_VIEWS } from '../views/side-views'
import { ViewStack } from '../ViewStack/ViewStack'
import { useLayoutStore } from '../../state/layout.store'
import { OpenFileContext } from '../../state/open-file.context'
import { GitNotice } from '../../features/git/GitNotice/GitNotice'
import { ProjectTabs } from '../../features/projects/ProjectTabs/ProjectTabs'
import { StatusBar } from '../../features/status-bar/StatusBar/StatusBar'
import { UpdateNotice } from '../../features/updates/UpdateNotice/UpdateNotice'
import styles from './Workbench.module.scss'

/**
 * Раскладка окна IDE (docs/architecture.md): 1 шапка (проект, ветка) и под ней вкладки
 * проектов, 2, 3 и 8 полосы переключения видов, 4 строка состояния, 5 левая панель,
 * 6 середина (файл, сценарии, статистика), 7 GUI провайдера LLM; поверх - поиск везде
 * и витрина. Workbench только расставляет зоны и связывает их с раскладкой; что внутри
 * каждой - решают фичи.
 */
export const Workbench = () => {
  const { t } = useTranslation()
  const side = useLayoutStore((state) => state.side)
  const main = useLayoutStore((state) => state.main)
  const provider = useLayoutStore((state) => state.provider)
  const selectSideView = useLayoutStore((state) => state.selectSideView)
  const selectMainView = useLayoutStore((state) => state.selectMainView)
  const selectProviderView = useLayoutStore((state) => state.selectProviderView)
  const resizePanel = useLayoutStore((state) => state.resizePanel)
  const openFile = useOpenFile()
  const toggleClaudePanel = useClaudePanelToggle()

  // ⌘Esc из любой зоны: правая панель с Claude Code и клавиатура в её поле (или спрятать).
  useClaudePanelKey(toggleClaudePanel)
  useFileViewOnSelect()

  return (
    <OpenFileContext value={openFile}>
      <div className={styles.workbench}>
        <TitleBar />
        <div className={styles.sheets}>
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

            <ActivityBar
              edge="start"
              label={t('mainViews.label')}
              views={MAIN_VIEWS}
              activeViewId={main.activeViewId}
              isPanelOpen={main.isOpen}
              onSelect={selectMainView}
            />
            <main className={clsx(styles.main, main.isOpen && styles.mainOpen)}>
              <ViewStack views={MAIN_VIEWS} activeViewId={main.activeViewId} isOpen={main.isOpen} />
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

            {ShowcaseLayer && (
              <Suspense fallback={null}>
                <ShowcaseLayer />
              </Suspense>
            )}
          </div>

          <StatusBar />
        </div>

        <SearchLayer />

        <NotificationArea>
          <UpdateNotice />
          <GitNotice />
        </NotificationArea>
      </div>
    </OpenFileContext>
  )
}
