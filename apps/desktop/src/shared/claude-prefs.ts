import type { EffortLevel, PermissionMode } from './claude'

/**
 * Настройки панели Claude Code (экран Settings в боковом меню, ADR 0009). Почти все -
 * на машину: это привычки человека, а не свойства репозитория. Исключение - источники
 * настроек CLI: их выбирают по проекту. Владелец - главный процесс, окно получает их в
 * ClaudeState и меняет патчем.
 */

/** Где стоит поле ввода: под лентой, ужатым в одну строку, колонкой слева или справа. */
export type ComposerLayout = 'bottom' | 'compact' | 'left' | 'right'

export const COMPOSER_LAYOUTS: readonly ComposerLayout[] = ['bottom', 'compact', 'left', 'right']

/** Какая клавиша отправляет: Enter или Cmd+Enter (тогда Enter переносит строку). */
export type SendKey = 'enter' | 'modEnter'

export const SEND_KEYS: readonly SendKey[] = ['enter', 'modEnter']

/**
 * Какие слои настроек Claude Code читает проект (`--setting-sources`): все; без
 * локального файла проекта; только свои (настройки человека).
 */
export type SettingSources = 'all' | 'noLocal' | 'user'

export const SETTING_SOURCES: readonly SettingSources[] = ['all', 'noLocal', 'user']

/** Показания вокруг поля ввода, которые можно спрятать по одному. */
export type IndicatorId =
  'contextBar' | 'contextLabel' | 'ring5h' | 'ringWeek' | 'ringModel' | 'tokensToday'

export const INDICATOR_IDS: readonly IndicatorId[] = [
  'contextBar',
  'contextLabel',
  'ring5h',
  'ringWeek',
  'ringModel',
  'tokensToday',
]

/** Поводы звука: ход закончен, вопросы к человеку, лимит, доплата, поломка. */
export type SoundEvent =
  'turnDone' | 'permission' | 'question' | 'plan' | 'limit' | 'extraUsage' | 'error'

export const SOUND_EVENTS: readonly SoundEvent[] = [
  'turnDone',
  'permission',
  'question',
  'plan',
  'limit',
  'extraUsage',
  'error',
]

/**
 * Поводы от самого тревожного к будничному (как в ACC). Из нескольких поводов одной
 * вкладки зовёт первый по списку; из звуков подряд слышен следующий, только если он
 * важнее предыдущего.
 */
export const SOUND_PRIORITY: readonly SoundEvent[] = [
  'error',
  'limit',
  'extraUsage',
  'permission',
  'question',
  'plan',
  'turnDone',
]

/**
 * Вкладка позвала человека: повод - тот же, что у звука. Его слушают и звук, и
 * свечение фоновой вкладки цветом повода.
 */
export type ConversationCall = { conversationId: string; reason: SoundEvent }

/**
 * Имя модели, которое можно передать аргументом запуска: без пробелов, кавычек,
 * запятых и переводов строк (иначе оболочку, которую никто не звал, обрежет аргумент -
 * опыт ACC). Ещё не с дефиса - CLI прочёл бы флаг: это проверяется отдельно.
 */
export const MODEL_NAME_PATTERN = /^[\w.:[\]/@-]{1,120}$/

/** Громкость звука по умолчанию, проценты. */
export const DEFAULT_SOUND_VOLUME = 70

/** Размер текста панели: 0 - как у IDE, иначе свой в пунктах. */
export const TEXT_SIZE_FOLLOW = 0
export const TEXT_SIZE_MIN = 8
export const TEXT_SIZE_MAX = 32

/** Сколько цвета у шкал: 100 - лестница от зелёного к красному, 0 - один спокойный тон. */
export const GAUGE_VIVID_FULL = 100
export const GAUGE_VIVID_CALM = 0

/** С какого числа строк вставка сворачивается в чип; 0 - никогда. */
export const DEFAULT_PASTE_COLLAPSE = 2

export type PanelPrefs = {
  /** Модель новой вкладки; null - как в последней выбранной вкладке. */
  newTabModel: string | null
  newTabEffort: EffortLevel | null
  newTabMode: PermissionMode | null
  composerLayout: ComposerLayout
  pasteCollapse: number
  sendKey: SendKey
  gaugeVivid: number
  hiddenIndicators: IndicatorId[]
  textSize: number
  /** Возвращать вкладки и черновики после перезапуска. */
  restoreTabs: boolean
  /** Каждое сообщение несёт открытый файл и выделенные строки. */
  shareEditor: boolean
  spellcheck: boolean
  /** Модели, которых нет в каталоге CLI (прокси, шлюз), - добавлены руками. */
  customModels: string[]
  mutedSounds: SoundEvent[]
  /** Громкость по поводу; нет записи - DEFAULT_SOUND_VOLUME. */
  soundVolumes: Partial<Record<SoundEvent, number>>
  /** Источники настроек CLI по папке проекта; нет записи - all. */
  settingSources: Record<string, SettingSources>
  /**
   * Путь к CLI, названный руками (экран «Claude Code not found»): IDE видит не тот PATH,
   * что терминал. Пусто - искать самой; путь, который не отвечает как Claude Code, не берётся.
   */
  cliPath: string
}

export const DEFAULT_PANEL_PREFS: PanelPrefs = {
  newTabModel: null,
  newTabEffort: null,
  newTabMode: null,
  composerLayout: 'bottom',
  pasteCollapse: DEFAULT_PASTE_COLLAPSE,
  sendKey: 'enter',
  gaugeVivid: GAUGE_VIVID_FULL,
  hiddenIndicators: [],
  textSize: TEXT_SIZE_FOLLOW,
  restoreTabs: true,
  shareEditor: true,
  spellcheck: true,
  customModels: [],
  mutedSounds: [],
  soundVolumes: {},
  settingSources: {},
  cliPath: '',
}

/** Изменение настроек: что не названо - остаётся как было. */
export type PanelPrefsPatch = Partial<PanelPrefs>
