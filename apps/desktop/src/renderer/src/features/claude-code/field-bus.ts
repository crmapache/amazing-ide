import { useComposerStore } from './composer.store'
import type { ComposerDraft } from './draft.types'

type Applier = (draft: ComposerDraft) => void

const appliers = new Map<string, Applier>()

/**
 * Поле вкладки принимает черновик извне (вернуть сообщение, откат, вынутое из очереди)
 * как один шаг своей истории отмен: прежний черновик - в одном Cmd+Z, а не
 * потерян. Поле на экране регистрирует себя здесь; возвращает отписку.
 */
export const registerFieldApplier = (key: string, apply: Applier): (() => void) => {
  appliers.set(key, apply)

  return () => {
    if (appliers.get(key) === apply) appliers.delete(key)
  }
}

/** Черновик в поле вкладки: через само поле, если оно на экране, иначе - прямо в черновик. */
export const applyDraft = (key: string, draft: ComposerDraft): void => {
  const apply = appliers.get(key)

  if (apply) apply(draft)
  else useComposerStore.getState().setDraft(key, draft)
}
