import type { KeyboardEvent } from 'react'
import clsx from 'clsx'

import { TAB_SELECTOR, TAB_ICON_SIZE, TAB_ICON_STROKE_WIDTH } from './Tabs.constants'
import styles from './Tabs.module.scss'
import type { TabsProps } from './Tabs.types'
import { nextTabIndex } from './Tabs.utils'

/**
 * Ряд вкладок-разделов: переключает содержимое одной зоны (разделы витрины,
 * позже - настройки). Стрелки ходят по кругу и сразу выбирают, в ряд по Tab
 * попадает только выбранная. Вкладки проектов в шапке - своя фича, не эта.
 */
export const Tabs = <TabId extends string>({ label, items, value, onChange }: TabsProps<TabId>) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = items.findIndex((item) => item.id === value)
    const target = nextTabIndex(event.key, current, items.length)
    const item = target === null ? undefined : items[target]

    if (target === null || !item) return

    event.preventDefault()
    onChange(item.id)
    event.currentTarget.querySelectorAll<HTMLElement>(TAB_SELECTOR)[target]?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className={styles.tabs} onKeyDown={handleKeyDown}>
      {items.map(({ id, label: itemLabel, icon: Icon }) => {
        const isActive = id === value

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={clsx(styles.tab, isActive && styles.active)}
            onClick={() => onChange(id)}>
            {Icon && <Icon size={TAB_ICON_SIZE} strokeWidth={TAB_ICON_STROKE_WIDTH} aria-hidden />}
            {itemLabel}
          </button>
        )
      })}
    </div>
  )
}
