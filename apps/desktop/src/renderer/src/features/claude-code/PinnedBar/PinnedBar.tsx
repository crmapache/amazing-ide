import { useMemo, useCallback } from 'react'

import { usePins, usePinsStore } from '../pins.store'
import { pinnedItems } from '../pins.utils'
import { useBarHeight, useForgetClosedPins } from './PinnedBar.hooks'
import styles from './PinnedBar.module.scss'
import type { PinnedBarProps } from './PinnedBar.types'
import { PinnedRow } from './parts/PinnedRow'

/**
 * Закреплённые сообщения разговора - полка поверх верха ленты (родитель - position:
 * relative). Поверх, а не над: в потоке она отнимала бы высоту у ленты, и читаемое
 * съезжало бы в момент закрепления. Под ней лента держит запас - высоту отдаёт onHeight.
 * Строки в порядке разговора, по одной строке; нажатие - прыжок к сообщению.
 */
export const PinnedBar = ({ conversationId, items, onJump, onHeight }: PinnedBarProps) => {
  const pins = usePins(conversationId)
  const unpin = usePinsStore((store) => store.unpin)
  const pinned = useMemo(() => pinnedItems(items, pins), [items, pins])
  const isShown = pinned.length > 0
  const barRef = useBarHeight(isShown, onHeight)

  useForgetClosedPins()

  // Стабильная: строки полки - memo, а лента под ними перерисовывается на каждый кусок ответа.
  const handleUnpin = useCallback(
    (itemId: string) => unpin(conversationId, [itemId]),
    [unpin, conversationId],
  )

  if (!isShown) return null

  return (
    <div ref={barRef} className={styles.pinnedBar}>
      {pinned.map((item) => (
        <PinnedRow key={item.id} item={item} onJump={onJump} onUnpin={handleUnpin} />
      ))}
    </div>
  )
}
