import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@amazing-ide/ui/Avatar'
import { DropdownButton } from '@amazing-ide/ui/DropdownButton'
import { Popover } from '@amazing-ide/ui/Popover'
import { usePopover } from '@amazing-ide/ui/Popover.hooks'

import { projectTone, projectInitials } from '../projects.utils'
import { CloneDialog } from '../CloneDialog/CloneDialog'
import { ProjectMenu } from '../ProjectMenu/ProjectMenu'
import { useActiveProject } from '../../../state/workspace.queries'

/**
 * Переключатель проекта в шапке, как в WebStorm: значок с инициалами и имя активного
 * проекта, по клику - меню проектов. Меню монтируется только открытым: так оно
 * каждый раз свежее и не держит память, пока закрыто.
 */
export const ProjectSwitcher = () => {
  const { t } = useTranslation()
  const project = useActiveProject()
  const popover = usePopover()
  const [isCloneOpen, setIsCloneOpen] = useState(false)

  const avatar = project && (
    <Avatar initials={projectInitials(project.name)} tone={projectTone(project.name)} />
  )

  return (
    <>
      <DropdownButton
        {...popover.triggerProps}
        label={project?.name ?? t('projects.noProject')}
        leading={avatar}
        menuLabel={t('projects.switcherLabel')}
      />
      <Popover {...popover.popoverProps} width="lg">
        {popover.isOpen && <ProjectMenu onClone={() => setIsCloneOpen(true)} />}
      </Popover>
      <CloneDialog open={isCloneOpen} onClose={() => setIsCloneOpen(false)} />
    </>
  )
}
