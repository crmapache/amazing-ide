import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './EditorTabs.module.scss'
import type { EditorTabsProps } from './EditorTabs.types'
import { tabLabels } from './EditorTabs.utils'
import { EditorTab } from './parts/EditorTab'
import { TabMenu } from './parts/TabMenu'

/**
 * Полоса вкладок открытых файлов над редактором: в порядке открытия, ряд за рядом -
 * не влезло в ширину, переносится вниз, как многорядные вкладки WebStorm. Больше
 * тридцати не бывает: новый файл закрывает самый первый из открытых.
 */
export const EditorTabs = ({ projectId, paths, active }: EditorTabsProps) => {
  const { t } = useTranslation()
  const [menu, setMenu] = useState<{ path: string; anchor: HTMLElement } | null>(null)
  const labels = useMemo(() => tabLabels(paths), [paths])

  const handleMenu = (path: string, anchor: HTMLElement) => setMenu({ path, anchor })

  const handleMenuClosed = () => setMenu(null)

  return (
    <div className={styles.editorTabs}>
      <div role="tablist" aria-label={t('editor.tabs.label')} className={styles.tabList}>
        {paths.map((path) => (
          <EditorTab
            key={path}
            projectId={projectId}
            path={path}
            label={labels.get(path) ?? path}
            isActive={path === active}
            onMenu={handleMenu}
          />
        ))}
      </div>
      <TabMenu
        projectId={projectId}
        paths={paths}
        // Вкладку закрыли, пока меню было открыто (файл удалили), - меню уходит вместе с ней.
        target={menu && paths.includes(menu.path) ? menu : null}
        onClose={handleMenuClosed}
      />
    </div>
  )
}
