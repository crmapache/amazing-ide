import clsx from 'clsx'

import styles from './Popover.module.scss'
import type { PopoverProps } from './Popover.types'

/**
 * Всплывающая панель под кнопкой: меню проекта, меню ветки. Держится на Popover API
 * браузера: верхний слой, закрытие по клику мимо и по Esc, привязка к кнопке через
 * CSS anchor positioning - без своего кода позиционирования. Связку с кнопкой даёт
 * usePopover.
 */
export const Popover = ({ id, ref, onToggle, width = 'md', children }: PopoverProps) => (
  <div
    id={id}
    ref={ref}
    popover="auto"
    className={clsx(styles.popover, styles[width])}
    onToggle={onToggle}>
    {children}
  </div>
)
