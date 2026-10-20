/**
 * accent - обычный ход. Остальное - ступени шкалы (контекст разговора, лимит) по мере
 * заполнения: success - запаса много, warning - быстрее нормы, high - близко к пределу,
 * danger - предел. Ступени красятся ролями --color-gauge-*: режим спокойных цветов
 * приглушает их, не трогая ход.
 */
export type ProgressBarTone = 'success' | 'accent' | 'warning' | 'high' | 'danger'

export type ProgressBarProps = {
  /**
   * Доля готового, от 0 до 1. Нет - доля неизвестна: по дорожке бежит отрезок. Только для
   * долгого ожидания, где долю взять неоткуда (модель пишет сценарий минуты).
   */
  value?: number | undefined
  /** Подпись для скринридера: что именно идёт. */
  label: string
  tone?: ProgressBarTone | undefined
}
