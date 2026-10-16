import type { KeyboardEvent } from 'react'
import { useRef, useEffect } from 'react'

import { ITEM_SELECTOR, NAVIGATION_KEYS, AUTOFOCUS_SELECTOR } from './Menu.constants'
import styles from './Menu.module.scss'
import type { MenuProps } from './Menu.types'
import { nextIndex } from './Menu.utils'

/**
 * Меню внутри всплывающей панели: секции, пункты, поле поиска. Стрелки ходят по
 * пунктам (из поля поиска - на первый), Home и End - в начало и конец, Enter
 * выбирает. Пункты - MenuItem, группы - MenuSection, линии - MenuSeparator.
 */
export const Menu = ({ label, autoFocus = false, children }: MenuProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autoFocus) return

    const target =
      ref.current?.querySelector<HTMLElement>(AUTOFOCUS_SELECTOR) ??
      ref.current?.querySelector<HTMLElement>(ITEM_SELECTOR)

    target?.focus()
  }, [autoFocus])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!NAVIGATION_KEYS.has(event.key)) return

    const items = [...event.currentTarget.querySelectorAll<HTMLElement>(ITEM_SELECTOR)]
    const current = items.indexOf(document.activeElement as HTMLElement)
    const target = nextIndex(event.key, current, items.length)

    if (target === null) return

    event.preventDefault()
    items[target]?.focus()
  }

  return (
    <div ref={ref} role="menu" aria-label={label} className={styles.menu} onKeyDown={handleKeyDown}>
      {children}
    </div>
  )
}
