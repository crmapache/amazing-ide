import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@amazing-ide/ui/IconButton'

import styles from './ActivityBar.module.scss'
import type { ActivityBarProps } from './ActivityBar.types'

/**
 * Вертикальная полоса иконок у края окна: зона 2 переключает виды левой панели,
 * зона 3 - GUI провайдеров LLM справа. Один компонент на обе стороны.
 */
export const ActivityBar = <ViewId extends string>({
  views,
  activeViewId,
  isPanelOpen,
  edge,
  label,
  onSelect,
}: ActivityBarProps<ViewId>) => {
  const { t } = useTranslation()

  return (
    <nav aria-label={label} className={clsx(styles.activityBar, styles[edge])}>
      {views.map((view) => (
        <IconButton
          key={view.id}
          icon={view.icon}
          label={t(view.labelKey)}
          active={isPanelOpen && view.id === activeViewId}
          onClick={() => onSelect(view.id)}
        />
      ))}
    </nav>
  )
}
