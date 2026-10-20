import clsx from 'clsx'
import { Flame } from 'lucide-react'

import {
  RING_BOX,
  FLAME_SIZE,
  RING_CENTER,
  RING_LENGTH,
  RING_RADIUS,
  RING_STROKE,
  FLAME_STROKE,
} from './RingMeter.constants'
import styles from './RingMeter.module.scss'
import type { RingMeterProps } from './RingMeter.types'
import { ringOffset } from './RingMeter.utils'

/**
 * Кольцо доли: сколько израсходовано из окна лимита. Читается краем глаза, места - как у
 * иконки. Под яркой дугой - бледная дуга ровного темпа: пока яркая короче, идём по
 * плану. Исчерпанное окно с доплатой - закрытое кольцо с огоньком. Только знак: цифру
 * рядом и подсказку ставит тот, кто его показывает.
 */
export const RingMeter = ({
  value,
  pace = null,
  tone = 'neutral',
  burning = false,
  label,
}: RingMeterProps) => (
  <span
    role="img"
    aria-label={label}
    className={clsx(styles.ringMeter, styles[burning ? 'accent' : tone])}>
    {/* eslint-disable-next-line no-restricted-syntax -- кольцо шкалы - данные, а не иконка */}
    <svg className={styles.ring} viewBox={`0 0 ${RING_BOX} ${RING_BOX}`} aria-hidden>
      <circle
        className={styles.track}
        cx={RING_CENTER}
        cy={RING_CENTER}
        r={RING_RADIUS}
        strokeWidth={RING_STROKE}
      />
      {pace !== null && !burning && (
        <circle
          className={styles.pace}
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          strokeWidth={RING_STROKE}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={ringOffset(pace)}
        />
      )}
      <circle
        className={styles.arc}
        cx={RING_CENTER}
        cy={RING_CENTER}
        r={RING_RADIUS}
        strokeWidth={RING_STROKE}
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={ringOffset(burning ? 100 : value)}
      />
    </svg>
    {burning && (
      <Flame className={styles.flame} size={FLAME_SIZE} strokeWidth={FLAME_STROKE} aria-hidden />
    )}
  </span>
)
