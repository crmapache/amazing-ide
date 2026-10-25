/** Семья модели Claude по её идентификатору: по ней подпись и иконка в меню. */
export type ModelFamily = 'fable' | 'opusplan' | 'opus' | 'sonnet' | 'haiku'

/** Что рисует чип MODEL: подпись, жёлтый акцент, подсказка и знак быстрого режима. */
export type ModelChip = {
  label: string
  warning: boolean
  hint: string
  fast: 'on' | 'dim' | 'warning' | null
}
