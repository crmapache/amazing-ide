import clsx from 'clsx'

import { useResizeDrag } from './ResizeHandle.hooks'
import styles from './ResizeHandle.module.scss'
import type { ResizeHandleProps } from './ResizeHandle.types'

/**
 * Невидимая ручка у края панели: тянешь мышью или двигаешь стрелками - панель
 * меняет ширину. Саму ширину и её пределы держит тот, кто ручку поставил.
 */
export const ResizeHandle = ({ edge, label, onResize }: ResizeHandleProps) => {
  const { handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown } =
    useResizeDrag(onResize)

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      className={clsx(styles.handle, styles[edge])}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    />
  )
}
