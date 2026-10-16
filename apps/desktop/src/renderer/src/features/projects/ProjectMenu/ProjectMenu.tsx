import { Plus, GitFork, FolderOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@amazing-ide/ui/Avatar'
import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'
import { MenuSection } from '@amazing-ide/ui/MenuSection'
import { MenuSeparator } from '@amazing-ide/ui/MenuSeparator'

import { displayPath, projectTone, projectInitials } from '../projects.utils'
import { useAppInfo } from '../../../state/app-info.queries'
import { useWorkspace, useWorkspaceActions } from '../../../state/workspace.queries'
import type { ProjectMenuProps } from './ProjectMenu.types'

const projectAvatar = (name: string) => (
  <Avatar initials={projectInitials(name)} tone={projectTone(name)} />
)

/**
 * Меню проекта, как в WebStorm: создать, открыть, клонировать; открытые проекты (с
 * путём, текущий подсвечен) и недавние - закрытые раньше.
 */
export const ProjectMenu = ({ onClone }: ProjectMenuProps) => {
  const { t } = useTranslation()
  const { data: workspace } = useWorkspace()
  const { data: appInfo } = useAppInfo()
  const { newProject, openProject, openRecentProject, activateProject } = useWorkspaceActions()
  const projects = workspace?.projects ?? []
  const recentProjects = workspace?.recentProjects ?? []

  return (
    <Menu label={t('projects.menuLabel')} autoFocus>
      <MenuItem icon={Plus} label={t('projects.newProject')} onSelect={newProject} />
      <MenuItem icon={FolderOpen} label={t('projects.openEllipsis')} onSelect={openProject} />
      <MenuItem icon={GitFork} label={t('projects.cloneRepository')} onSelect={onClone} />

      {projects.length > 0 && <MenuSeparator />}
      {projects.length > 0 && (
        <MenuSection title={t('projects.openProjects')}>
          {projects.map((project) => (
            <MenuItem
              key={project.id}
              leading={projectAvatar(project.name)}
              label={project.name}
              description={displayPath(project.rootPath, appInfo?.homeDir)}
              current={project.id === workspace?.activeProjectId}
              onSelect={() => activateProject(project.id)}
            />
          ))}
        </MenuSection>
      )}

      {recentProjects.length > 0 && <MenuSeparator />}
      {recentProjects.length > 0 && (
        <MenuSection title={t('projects.recentProjects')}>
          {recentProjects.map((project) => (
            <MenuItem
              key={project.rootPath}
              leading={projectAvatar(project.name)}
              label={project.name}
              description={displayPath(project.rootPath, appInfo?.homeDir)}
              onSelect={() => openRecentProject(project.rootPath)}
            />
          ))}
        </MenuSection>
      )}
    </Menu>
  )
}
