import { useTranslation } from 'react-i18next'

import { ProjectTab } from '../ProjectTab/ProjectTab'
import { useWorkspace, useWorkspaceActions } from '../../../state/workspace.queries'
import styles from './ProjectTabs.module.scss'

/**
 * Строка вкладок открытых проектов под шапкой: вкладки делят ширину окна поровну.
 * Открыть новый проект - через переключатель проекта в шапке или Cmd+O.
 */
export const ProjectTabs = () => {
  const { t } = useTranslation()
  const { data } = useWorkspace()
  const { closeProject, activateProject } = useWorkspaceActions()

  if (!data || data.projects.length === 0) return null

  return (
    <div role="tablist" aria-label={t('projects.tabsLabel')} className={styles.projectTabs}>
      {data.projects.map((project) => (
        <ProjectTab
          key={project.id}
          project={project}
          isActive={project.id === data.activeProjectId}
          onActivate={activateProject}
          onClose={closeProject}
        />
      ))}
    </div>
  )
}
