import type { SendKey } from '@shared/claude-prefs'

import { PANEL_KEYS, OPEN_PANEL_KEY } from '../panel-keys.constants'
import { SEARCH_KEYS } from '../search.constants'
import type { KeyRow, KeyGroup, KeyRowId, KeyWhenRowId } from './KeysScreen.types'

const row = (id: KeyRowId, chords: KeyRow['chords']): KeyRow => ({ id, when: null, chords })

/** Строка с «когда» - подпись и пояснение по одному id. */
const rowWhen = (id: KeyWhenRowId, chords: KeyRow['chords']): KeyRow => ({ id, when: id, chords })

/**
 * Все клавиши панели по разделам ACC: вкладки, поле сообщения, агент, панель, окно
 * поиска. Отправка и перенос строки зависят от Settings → Sending a message. Клавиши
 * поля и поиска слушают сами поле и окно поиска - здесь они перечислены так, как там
 * работают; поменял клавишу там - поправь строку здесь, иначе шпаргалка врёт.
 */
export const keyGroups = (sendKey: SendKey): KeyGroup[] => {
  const enter = ['Enter']
  const modEnter = ['⌘', 'Enter']
  const shiftEnter = ['⇧', 'Enter']

  return [
    {
      id: 'tabs',
      rows: [
        rowWhen('nextTab', [PANEL_KEYS.nextTab]),
        rowWhen('previousTab', [PANEL_KEYS.previousTab]),
        row('newTab', [PANEL_KEYS.newTab]),
        rowWhen('closeTab', [PANEL_KEYS.closeTab]),
        rowWhen('reopenTab', [PANEL_KEYS.reopenTab]),
        // Единственная клавиша не панели, а окна - как в ACC, последней в разделе вкладок.
        rowWhen('openPanel', [OPEN_PANEL_KEY]),
      ],
    },
    {
      id: 'message',
      rows: [
        row('send', [sendKey === 'modEnter' ? modEnter : enter]),
        row('newLine', [sendKey === 'modEnter' ? enter : shiftEnter]),
        rowWhen('queue', [['⌥', 'Enter']]),
        rowWhen('history', [['↑'], ['↓']]),
        row('commands', [['/']]),
        row('files', [['@']]),
        rowWhen('shell', [['!']]),
        row('deleteWord', [['⌘', '⌫']]),
        row('undo', [['⌘', 'Z']]),
        row('redo', [['⇧', '⌘', 'Z']]),
      ],
    },
    {
      id: 'agent',
      rows: [rowWhen('stop', [['Esc']]), row('mode', [['⇧', 'Tab']]), rowWhen('answer', [['1-9']])],
    },
    {
      id: 'panel',
      rows: [row('search', [PANEL_KEYS.search]), rowWhen('fork', [['⌥', 'B']])],
    },
    {
      id: 'search',
      rows: [
        row('searchChat', [SEARCH_KEYS.chat]),
        row('searchAll', [SEARCH_KEYS.project]),
        row('searchAsk', [SEARCH_KEYS.ai]),
        row('matchCase', [SEARCH_KEYS.matchCase]),
        row('wholeWords', [SEARCH_KEYS.wholeWords]),
      ],
    },
  ]
}
