import { Menu } from 'electron'
import type { BrowserWindow, ContextMenuParams, MenuItemConstructorOptions } from 'electron'

/** Сколько исправлений показать над остальными пунктами: дальше их всё равно не читают. */
const MAX_SUGGESTIONS = 6

/**
 * Пункты контекстного меню: исправления слова под курсором и правка текста. Пустой
 * список - меню не нужно (щелчок мимо текста и полей).
 */
export const spellMenuItems = (
  window: BrowserWindow,
  params: ContextMenuParams,
): MenuItemConstructorOptions[] => {
  const { webContents } = window
  const word = params.misspelledWord
  const fixes: MenuItemConstructorOptions[] = word
    ? [
        ...params.dictionarySuggestions.slice(0, MAX_SUGGESTIONS).map((suggestion) => ({
          label: suggestion,
          click: () => webContents.replaceMisspelling(suggestion),
        })),
        {
          label: 'Add to Dictionary',
          click: () => webContents.session.addWordToSpellCheckerDictionary(word),
        },
        { type: 'separator' },
      ]
    : []

  if (params.isEditable) {
    return [
      ...fixes,
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
    ]
  }

  return params.selectionText ? [{ role: 'copy' }] : []
}

/**
 * Контекстное меню окна с подсказками проверки орфографии. Где проверки нет (поля имён
 * и путей), слова не подчёркнуты и исправлений в меню нет. Отмена из меню идёт событием
 * `historyUndo` - поле ввода Claude Code перехватывает его в свою историю.
 */
export const installSpellMenu = (window: BrowserWindow): void => {
  window.webContents.on('context-menu', (_event, params) => {
    const items = spellMenuItems(window, params)

    if (items.length > 0) Menu.buildFromTemplate(items).popup({ window })
  })
}
