import { X, ChevronLeft } from 'lucide-react'

import { IconButton } from '../IconButton/IconButton'
import { useSheetEscape, useScrollPlaces } from './Sheet.hooks'
import styles from './Sheet.module.scss'
import type { SheetProps } from './Sheet.types'

/**
 * Лист, который выезжает справа поверх панели: боковое меню со своим экраном за каждым
 * пунктом. Шапка - стрелка назад на вложенных экранах, заголовок с подсказкой, крестик.
 * Esc - шаг назад, на корне закрывает; клик по затемнению закрывает. Встаёт поверх
 * ближайшего родителя с position: relative.
 */
export const Sheet = ({
  open,
  title,
  hint,
  onBack,
  onClose,
  backLabel,
  closeLabel,
  screenKey,
  restoreScroll = false,
  footer,
  children,
}: SheetProps) => {
  const { bodyRef, handleScroll } = useScrollPlaces(open, screenKey, restoreScroll)

  useSheetEscape(open, onBack ?? onClose)

  if (!open) return null

  return (
    <>
      <div className={styles.scrim} aria-hidden onClick={onClose} />
      <aside className={styles.sheet} aria-label={title}>
        <div className={styles.head}>
          {onBack && <IconButton icon={ChevronLeft} size="sm" label={backLabel} onClick={onBack} />}
          <div className={styles.titles}>
            <span className={styles.title}>{title}</span>
            {hint && <span className={styles.hint}>{hint}</span>}
          </div>
          <IconButton icon={X} size="sm" label={closeLabel} onClick={onClose} />
        </div>
        <div ref={bodyRef} className={styles.body} onScroll={handleScroll}>
          {children}
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </aside>
    </>
  )
}
