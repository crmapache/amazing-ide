import type { ParseKeys } from 'i18next'

import type { RewindScope, RewindPreview, RewindRefusal } from '@shared/claude-rewind'

/** Что вернуть - три варианта терминального /rewind, по порядку ACC. */
export const REWIND_CHOICES: { scope: RewindScope; labelKey: ParseKeys }[] = [
  { scope: 'conversation', labelKey: 'claudeCode.rewind.conversation' },
  { scope: 'code', labelKey: 'claudeCode.rewind.code' },
  { scope: 'both', labelKey: 'claudeCode.rewind.both' },
]

/** Сколько файлов диалог называет до «and N more»: горстка читается с ходу, сорок - нет. */
export const FILES_SHOWN = 5

/** Почему кода нет - словами диалога (состояние предпросмотра или подробность отказа code). */
export const CODE_STATE_KEYS: Record<
  Exclude<RewindPreview['state'], 'ready' | 'unavailable'>,
  ParseKeys
> = {
  none: 'claudeCode.rewind.none',
  off: 'claudeCode.rewind.off',
  notTracked: 'claudeCode.rewind.notTracked',
  noCheckpoint: 'claudeCode.rewind.noCheckpoint',
}

/** Отказы, у которых свои слова; code и other собираются с подробностью. */
export const REFUSAL_KEYS: Record<Exclude<RewindRefusal, 'code' | 'other'>, ParseKeys> = {
  busy: 'claudeCode.rewind.refused.busy',
  gone: 'claudeCode.rewind.refused.gone',
  moved: 'claudeCode.rewind.refused.moved',
  midCall: 'claudeCode.rewind.refused.midCall',
  notSaved: 'claudeCode.rewind.refused.notSaved',
  unsupported: 'claudeCode.rewind.refused.unsupported',
  noProcess: 'claudeCode.rewind.refused.noProcess',
  ended: 'claudeCode.rewind.refused.ended',
}
