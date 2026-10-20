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
  placement,
  resizeLabel,
  onResize,
}: SidePanelProps<ViewId>) => {
  const handleEdge = placement === 'start' ? 'end' : 'start'

  const handleResize = (delta: number) => onResize(placement === 'start' ? delta : -delta)

  return (
    <aside
      className={clsx(styles.sidePanel, !isOpen && styles.closed)}
      // По нему «открыть панель» узнаёт, что фокус уже в правой панели (actions/claude-panel.ts).
      data-placement={placement}
      // eslint-disable-next-line no-restricted-syntax -- ширину задаёт перетаскивание
      style={{ width }}>
      <ViewStack views={views} activeViewId={activeViewId} isOpen={isOpen} />
      <ResizeHandle edge={handleEdge} label={resizeLabel} onResize={handleResize} />
    </aside>
  )
}
