import type { Conversation } from '@shared/claude'

/**
 * Тон режима: обычный - тихий, план - справочный, правки без вопроса - внимание, без
 * вопросов - красный.
 */
export type ModeTone = 'quiet' | 'info' | 'accent' | 'danger' | 'warning'

/** Раздел панели модели, усилия и режима. */
export type SetupSection = 'model' | 'effort' | 'mode'

export type ComposerStatusProps = {
  conversation: Conversation
}

/** Части строки получают тот же разговор, что и сама строка. */
export type PickerProps = ComposerStatusProps
