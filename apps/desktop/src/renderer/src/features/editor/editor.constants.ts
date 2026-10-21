/**
 * Пауза в наборе, после которой файл сам пишется на диск. Короткая, потому что рядом
 * работает Claude Code: он читает файлы с диска, и правка, ждущая записи, для него
 * невидима. Уход из редактора и закрытие вкладки пишут сразу, без паузы.
 */
export const AUTOSAVE_DELAY_MS = 1_000

/**
 * Пауза после движения выделения, прежде чем сказать о нём полю ввода Claude Code: пока
 * выделяют мышью, поле не перерисовывается на каждый сдвиг.
 */
export const SELECTION_PUBLISH_DELAY_MS = 150

/** Команда Monaco за ⌘S в редакторе: записать файл по явной просьбе. */
export const SAVE_COMMAND = 'amazingIde.saveFile'

/**
 * Дорожка полосы прокрутки редактора. Бегунок на ней (monaco.css) - как родной тонкий у
 * Chromium на macOS в соседних панелях: 6 px в 2 px от края. Родная дорожка на пиксель
 * шире (11 px), но бегунок у неё сдвинут к краю, так он встаёт ровно туда же.
 */
export const SCROLLBAR_SIZE = 10

/**
 * Команды поиска Monaco. Его панели поиска в IDE нет (будет свой поиск): сочетания этих
 * команд сняты, а в палитре команд их не видно. Сам модуль поиска остаётся - на нём
 * держится мультикурсор (⌘D, правка всех вхождений).
 */
export const MONACO_FIND_COMMANDS: ReadonlySet<string> = new Set([
  'actions.find',
  'actions.findWithSelection',
  'editor.actions.findWithArgs',
  'editor.action.nextMatchFindAction',
  'editor.action.previousMatchFindAction',
  'editor.action.goToMatchFindAction',
  'editor.action.nextSelectionMatchFindAction',
  'editor.action.previousSelectionMatchFindAction',
  'editor.action.startFindReplaceAction',
  'closeFindWidget',
  'toggleFindCaseSensitive',
  'toggleFindWholeWord',
  'toggleFindRegex',
  'toggleFindInSelection',
  'togglePreserveCase',
  'editor.action.replaceOne',
  'editor.action.replaceAll',
  'editor.action.selectAllMatches',
])
