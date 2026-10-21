import type { editor } from 'monaco-editor/editor/editor.api.js'

import { SCROLLBAR_SIZE } from './editor.constants'
import { editorTypography } from './monaco-theme'
import { EDITOR_THEME } from './monaco-theme.constants'

/** Отступ кода от верха листа - ступень шкалы отступов, как у остальных листов. */
const PADDING_ROLE = '--space-2'

/**
 * Полосы прокрутки - как родные в соседних панелях (base.css): тонкие, без теней,
 * бегунок рисует monaco.css. Классические полосы macOS видны
 * всегда, накладные - только при прокрутке и под курсором. Какие сейчас, решает система
 * и меняет на ходу (подключили мышь), поэтому режим приходит снаружи.
 */
export const scrollbarOptions = (classic: boolean): editor.IEditorScrollbarOptions => {
  const visibility = classic ? 'visible' : 'auto'

  return {
    vertical: visibility,
    horizontal: visibility,
    useShadows: false,
    verticalScrollbarSize: SCROLLBAR_SIZE,
    horizontalScrollbarSize: SCROLLBAR_SIZE,
  }
}

/**
 * Настройки редактора середины окна. Шрифт и тема - из токенов. Миникарты нет, как в
 * WebStorm; липких заголовков тоже: строки внешних блоков поверх кода владелец просил
 * убрать. Подсказки по словам и цветные скобки выключены: подсказки дадут языковые
 * серверы, а радуга скобок спорит с подсветкой ролей.
 */
export const editorOptions = (
  classicScrollbars: boolean,
): editor.IStandaloneEditorConstructionOptions => {
  const padding = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(PADDING_ROLE),
  )

  return {
    model: null,
    theme: EDITOR_THEME,
    ...editorTypography(),
    automaticLayout: true,
    fixedOverflowWidgets: true,
    padding: { top: padding, bottom: padding },
    tabSize: 2,
    minimap: { enabled: false },
    stickyScroll: { enabled: false },
    bracketPairColorization: { enabled: false },
    guides: { indentation: true, bracketPairs: false },
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    wordBasedSuggestions: 'off',
    parameterHints: { enabled: false },
    'semanticHighlighting.enabled': false,
    smoothScrolling: true,
    cursorSmoothCaretAnimation: 'on',
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    renderLineHighlightOnlyWhenFocus: true,
    scrollbar: scrollbarOptions(classicScrollbars),
    // Меню правой кнопки - наше (EditorContextMenu): своё Monaco рисует в теневом DOM внутри
    // панели, куда не доходят цвета темы, и край панели его обрезает.
    contextmenu: false,
    // Необычные переводы строк (U+2028 в JSON и минифицированном коде) Monaco по умолчанию
    // предлагает удалить системным окном, а «да» молча переписало бы файл.
    unusualLineTerminators: 'off',
    // Буквы, похожие на латинские, Monaco обводит рамкой как возможную подмену символа. Для
    // кириллицы это каждая с, у, а, о в русском тексте и комментариях - шум, а не находка.
    // Невидимые символы (широкий пробел и подобные) рамкой по-прежнему: глазом их не отличить.
    unicodeHighlight: { ambiguousCharacters: false },
  }
}
