import type { EffortLevel, PermissionMode } from './claude'

/**
 * Настройки панели Claude Code (экран Settings в боковом меню, ADR 0009). Все - на
 * машину: это привычки человека, а не свойства репозитория. Владелец - главный процесс,
 * окно получает их в ClaudeState и меняет патчем.
 */

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
  pasteCollapse: number
  gaugeVivid: number
  /** Каждое сообщение несёт открытый файл и выделенные строки. */
  shareEditor: boolean
  /** Модели, которых нет в каталоге CLI (прокси, шлюз), - добавлены руками. */
  customModels: string[]
  mutedSounds: SoundEvent[]
  /** Громкость по поводу; нет записи - DEFAULT_SOUND_VOLUME. */
  soundVolumes: Partial<Record<SoundEvent, number>>
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
  pasteCollapse: DEFAULT_PASTE_COLLAPSE,
  gaugeVivid: GAUGE_VIVID_FULL,
  shareEditor: true,
  customModels: [],
  mutedSounds: [],
  soundVolumes: {},
  cliPath: '',
}

/** Изменение настроек: что не названо - остаётся как было. */
export type PanelPrefsPatch = Partial<PanelPrefs>
