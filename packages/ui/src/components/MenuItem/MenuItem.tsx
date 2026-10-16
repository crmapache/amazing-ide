import type { MouseEvent } from 'react'
import clsx from 'clsx'

import { MENU_ICON_SIZE, MENU_ICON_STROKE_WIDTH } from './MenuItem.constants'
import styles from './MenuItem.module.scss'
import type { MenuItemProps } from './MenuItem.types'

/**
 * Пункт меню: иконка или значок, подпись, по желанию вторая строка и подсказка
 * справа. Выбор закрывает всплывающую панель, в которой пункт стоит.
 */
export const MenuItem = ({
  label,
  description,
  icon: Icon,
  leading,
  current = false,
  disabled = false,
  hint,
  onSelect,
}: MenuItemProps) => {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.closest<HTMLElement>('[popover]')?.hidePopover()
    onSelect()
  }

  const visual =
    leading ??
    (Icon ? (
      <Icon size={MENU_ICON_SIZE} strokeWidth={MENU_ICON_STROKE_WIDTH} aria-hidden />
    ) : (
      <span className={styles.placeholder} />
    ))

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      aria-current={current || undefined}
      className={clsx(styles.menuItem, current && styles.current)}
      onClick={handleClick}>
      <span className={styles.visual}>{visual}</span>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </button>
  )
}
