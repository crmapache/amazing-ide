import clsx from 'clsx'

import { ResizeHandle } from '@amazing-ide/ui/ResizeHandle'

import { ViewStack } from '../ViewStack/ViewStack'
import styles from './SidePanel.module.scss'
import type { SidePanelProps } from './SidePanel.types'

/**
 * Боковая панель рабочей области: зона 5 (виды вроде дерева файлов) и зона 7
 * (GUI провайдера LLM). Показывает активный вид, остальные открытые держит
 * смонтированными, но скрытыми. Ширину меняет ручка у внутреннего края.
 */
export const SidePanel = <ViewId extends string>({
  views,
  activeViewId,
  isOpen,
  width,
  minWidth,
  placement,
  resizeLabel,
  onResize,
  ref,
}: SidePanelProps<ViewId>) => {
  const handleEdge = placement === 'start' ? 'end' : 'start'

  const handleResize = (delta: number) => onResize(placement === 'start' ? delta : -delta)

  return (
    <aside
      ref={ref}
      className={clsx(styles.sidePanel, !isOpen && styles.closed)}
      // По нему «открыть панель» узнаёт, что фокус уже в правой панели (actions/claude-panel.ts).
      data-placement={placement}
      // eslint-disable-next-line no-restricted-syntax -- ширину задают перетаскивание и место в окне
      style={{ width, minWidth }}>
      <ViewStack views={views} activeViewId={activeViewId} isOpen={isOpen} />
      <ResizeHandle edge={handleEdge} label={resizeLabel} onResize={handleResize} />
    </aside>
  )
}
