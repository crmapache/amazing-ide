import styles from '../StreamSwitcher.module.scss'
import type { ChipClockProps } from '../StreamSwitcher.types'
import { TICK_MS } from '../../claude.constants'
import { formatDuration } from '../../claude.utils'
import { useNow } from '../../clock.hooks'

/** Сколько идёт работа за чипом - тикает своим компонентом, чтобы не перерисовывать ряд. */
export const ChipClock = ({ startedAt }: ChipClockProps) => {
  const now = useNow(startedAt > 0, TICK_MS)

  if (!startedAt) return null

  return <span className={styles.duration}>{formatDuration(Math.max(0, now - startedAt))}</span>
}
