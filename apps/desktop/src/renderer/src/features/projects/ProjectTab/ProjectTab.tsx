import type { MouseEvent } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@amazing-ide/ui/IconButton'

import { MIDDLE_MOUSE_BUTTON } from './ProjectTab.constants'
import styles from './ProjectTab.module.scss'
import type { ProjectTabProps } from './ProjectTab.types'

/**
 * Вкладка одного проекта в верхней полосе. Клик - переключиться, крестик или
 * средняя кнопка мыши - закрыть. Полный путь - в подсказке.
 */
export const ProjectTab = ({ project, isActive, onActivate, onClose }: ProjectTabProps) => {
  const { t } = useTranslation()

  const handleActivate = () => onActivate(project.id)

  const handleClose = () => onClose(project.id)

  const handleAuxClick = (event: MouseEvent) => {
    if (event.button === MIDDLE_MOUSE_BUTTON) handleClose()
  }

  return (
    <div className={clsx(styles.projectTab, isActive && styles.active)}>
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        title={project.rootPath}
        className={styles.label}
        onClick={handleActivate}
        onAuxClick={handleAuxClick}>
        {project.name}
      </button>
      <span className={styles.close}>
        <IconButton
          icon={X}
          size="sm"
          label={t('projects.close', { name: project.name })}
          onClick={handleClose}
        />
      </span>
    </div>
  )
}
