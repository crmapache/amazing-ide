import type { ConversationMods } from '@shared/claude-panel'

export type ModDockProps = {
  /** Что моды держат на экране; нет - карточки нет. */
  mods: ConversationMods | undefined
}
