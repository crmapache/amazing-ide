import { RING_LENGTH } from './RingMeter.constants'

/** Сдвиг штриха окружности, при котором видна доля percent: 0 - пусто, 100 - круг. */
export const ringOffset = (percent: number): number =>
  RING_LENGTH * (1 - Math.min(100, Math.max(0, percent)) / 100)
