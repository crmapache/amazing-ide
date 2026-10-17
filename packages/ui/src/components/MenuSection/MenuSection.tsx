import { useState } from 'react'
import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'

import { SECTION_CHEVRON_SIZE, SECTION_CHEVRON_STROKE_WIDTH } from './MenuSection.constants'
import styles from './MenuSection.module.scss'
import type { MenuSectionProps } from './MenuSection.types'

/**
 * Группа пунктов меню или вариантов ListBox с заголовком: «Open Projects», «Files».
 * Сворачиваемая группа помнит своё состояние, пока открыто меню; во время поиска
 * раскрыта всегда.
 */
export const MenuSection = ({
  title,
  collapsible = false,
  defaultCollapsed = false,
  forceExpanded = false,
  children,
}: MenuSectionProps) => {
  const [isExpandedByUser, setIsExpanded] = useState(!defaultCollapsed)
  const isExpanded = forceExpanded || isExpandedByUser

  const handleToggle = () => setIsExpanded((value) => !value)

  return (
    <div role="group" aria-label={title} className={styles.menuSection}>
      {collapsible ? (
        <button
          type="button"
          aria-expanded={isExpanded}
          className={clsx(styles.title, styles.toggle)}
          onClick={handleToggle}>
          <ChevronDown
            className={clsx(styles.chevron, !isExpanded && styles.collapsed)}
            size={SECTION_CHEVRON_SIZE}
            strokeWidth={SECTION_CHEVRON_STROKE_WIDTH}
            aria-hidden
          />
          {title}
        </button>
      ) : (
        <div className={styles.title}>{title}</div>
      )}
      {isExpanded && children}
    </div>
  )
}
