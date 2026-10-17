import styles from './ListBox.module.scss'
import type { ListBoxProps } from './ListBox.types'

/**
 * Список вариантов под полем поиска (combobox): поиск везде, позже - переход к файлу.
 * В отличие от Menu фокус в список не уходит: он остаётся в поле, стрелки двигают
 * выделение, и печатать можно не отрываясь. Клавиши и связку с полем даёт useListBox.
 */
export const ListBox = ({ id, label, children }: ListBoxProps) => (
  <div id={id} role="listbox" aria-label={label} className={styles.listBox}>
    {children}
  </div>
)
