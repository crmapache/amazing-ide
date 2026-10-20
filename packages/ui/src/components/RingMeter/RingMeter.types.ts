/**
 * Тон дуги - ступень шкалы: success - в запасе, warning - быстрее нормы, high - заметно
 * быстрее, danger - почти кончилось (роли --color-gauge-*, их приглушает режим спокойных
 * цветов). accent - доплата сверх тарифа, neutral - без оценки: это не ступени.
 */
export type RingMeterTone = 'success' | 'warning' | 'high' | 'danger' | 'accent' | 'neutral'

export type RingMeterProps = {
  /** Сколько израсходовано, проценты 0-100 (больше - рисуется как 100). */
  value: number
  /**
   * Бледная дуга под яркой: сколько «положено» израсходовать к сегодняшнему дню при
   * ровном темпе. null - темпа у окна нет.
   */
  pace?: number | null | undefined
  tone?: RingMeterTone | undefined
  /** Окно исчерпано и идёт доплата: кольцо закрыто и горит, цифры рядом не нужно. */
  burning?: boolean | undefined
  /** Что показывает кольцо - для скринридера. */
  label: string
}
