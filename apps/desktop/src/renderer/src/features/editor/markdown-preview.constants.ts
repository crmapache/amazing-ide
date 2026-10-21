/**
 * Метка строки исходника между блоками разметки: по меткам просмотр и код прокручиваются
 * вместе. Своё имя тега - его не спутать с HTML из файла.
 */
export const LINE_MARK_TAG = 'md-line'

/**
 * Приставка к id заголовков и якорей файла: просмотр стоит в странице окна, и id
 * «root» из README не должен совпасть с id самого окна (так же делает GitHub).
 */
export const ANCHOR_PREFIX = 'md-'

/** Шапка YAML в начале файла (--- … --- или …): показывается блоком кода, а не текстом. */
export const FRONT_MATTER = /^---[ \t]*\n([\s\S]*?)\n(?:---|\.\.\.)[ \t]*(?:\n|$)/

/** Пауза в наборе, после которой просмотр перерисовывается: не на каждую букву. */
export const PREVIEW_RENDER_DELAY_MS = 120

/** Узлы DOM, которые просмотр понимает: остальное (комментарии) пропускается. */
export const ELEMENT_NODE = 1
export const TEXT_NODE = 3

/**
 * HTML из файла, который просмотр рисует, - то же, что пускает GitHub. Своими
 * элементами React: строкой в страницу он не попадает, а у каждого тега - только
 * разрешённые атрибуты (KEPT_ATTRIBUTES). Тег не из списка снимается, его содержимое
 * остаётся.
 */
export const KEPT_TAGS: ReadonlySet<string> = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'caption',
  'center',
  'code',
  'dd',
  'del',
  'details',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'input',
  'ins',
  'kbd',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strike',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'tt',
  'u',
  'ul',
  'var',
])

/**
 * Теги, которые снимаются вместе с содержимым: код, стили, встроенные страницы, формы,
 * медиа и всё, что не текст документа.
 */
export const DROPPED_TAGS: ReadonlySet<string> = new Set([
  'audio',
  'base',
  'button',
  'canvas',
  'embed',
  'form',
  'frame',
  'frameset',
  'head',
  'iframe',
  'link',
  'math',
  'meta',
  'noscript',
  'object',
  'script',
  'select',
  'style',
  'svg',
  'template',
  'textarea',
  'title',
  'video',
])

/** Теги, внутри которых пустой текст между строками - не текст (React ругался бы). */
export const NO_TEXT_TAGS: ReadonlySet<string> = new Set([
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'ul',
  'ol',
  'dl',
])

/** Выравнивание, которое GitHub понимает в атрибуте align. */
export const ALIGNS: ReadonlySet<string> = new Set(['left', 'center', 'right', 'justify'])

/** Ширина и высота картинки из атрибутов: пиксели (с px или без) или процент. */
export const SIZE_VALUE = /^\d{1,5}(?:px|%)?$/i

/** Число в атрибуте (colspan, start). */
export const NUMBER_VALUE = /^\d{1,4}$/
