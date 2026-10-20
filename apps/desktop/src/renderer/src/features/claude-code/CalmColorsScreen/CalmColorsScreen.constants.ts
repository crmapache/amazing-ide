import type { RingMeterTone } from '@amazing-ide/ui/RingMeter.types'

/**
 * По показанию на каждую ступень лестницы - с тех процентов, где ступени и начинаются:
 * на полном цвете четыре кольца стоят зелёным, жёлтым, оранжевым и красным, как под
 * полем; ползунок вниз - тянутся к одному тону вместе.
 */
export const CALM_LADDER: readonly { value: number; tone: RingMeterTone }[] = [
  { value: 12, tone: 'success' },
  { value: 58, tone: 'warning' },
  { value: 78, tone: 'high' },
  { value: 94, tone: 'danger' },
]

/**
 * Сколько занято в образце полосы контекста: ради такой полосы режим и просят - на
 * полном цвете она красная, как над полем.
 */
export const CALM_BAR_SHARE = 0.87
