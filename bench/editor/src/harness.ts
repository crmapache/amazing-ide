/**
 * Общая часть стенда: один и тот же файл, одни и те же замеры для любого движка.
 * Движок подключается адаптером - создать редактор, поставить курсор, отдать длину.
 */

export type EditorAdapter = {
  /** jsx - файл .tsx: движку нужен разбор JSX. */
  mount: (element: HTMLElement, text: string, jsx: boolean) => void | Promise<void>
  /** Курсор в конец строки на доле fraction от начала файла. */
  moveCursorTo: (fraction: number) => void
  moveCursorToEnd: () => void
  focus: () => void
  length: () => number
}

declare global {
  interface Window {
    __bench?: unknown
  }
}

/** Детерминированный TypeScript: классы, интерфейсы, функции, строки, комментарии. */
export const generateTypeScript = (lines: number): string => {
  const block = (index: number) => [
    `// Блок ${index}: сервис с состоянием и асинхронным методом`,
    `export interface Item${index} { id: number; name: string; tags: string[]; meta?: Record<string, unknown> }`,
    `export class Service${index}<T extends Item${index}> {`,
    `  private readonly items = new Map<number, T>()`,
    `  constructor(private readonly prefix: string = 'svc-${index}') {}`,
    `  async load(ids: number[]): Promise<T[]> {`,
    // Без предиката типа в стрелке, (item): item is T =>, - грамматика Lezer его не
    // разбирает, и файл превращается в сотни узлов-ошибок. Здесь - чистый код.
    `    const found = ids.map((id) => this.items.get(id)).filter((item) => item !== undefined) as T[]`,
    `    if (found.length === 0) throw new Error(\`\${this.prefix}: nothing for \${ids.join(', ')}\`)`,
    `    return found.sort((left, right) => left.name.localeCompare(right.name) || left.id - right.id)`,
    `  }`,
    `}`,
    `export const total${index} = [1, 2, 3, ${index}].reduce((sum, value) => sum + value * 2, 0) // ${index * 7}`,
    ``,
  ]
  const result: string[] = []

  for (let index = 0; result.length < lines; index++) result.push(...block(index))

  return result.slice(0, lines).join('\n')
}

const nextPaint = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )

/**
 * Задержка от нажатия до кадра: время события keydown → кадр, в котором редактор
 * уже обработал ввод (rAF), → момент сразу после этого кадра (MessageChannel).
 */
const watchTyping = (samples: number[], phases: TypingPhase[]) => {
  let pending: TypingPhase | null = null

  // Когда редактор на самом деле поменял DOM после нажатия - для разбора по фазам.
  new MutationObserver(() => {
    if (pending && pending.mutationMs === null)
      pending.mutationMs = performance.now() - pending.start
  }).observe(document.getElementById('editor') as HTMLElement, {
    subtree: true,
    childList: true,
    characterData: true,
  })

  document.addEventListener(
    'keydown',
    (event) => {
      const start = event.timeStamp
      const phase: TypingPhase = {
        start,
        handlerMs: performance.now() - start,
        mutationMs: null,
        frameMs: 0,
        doneMs: 0,
      }

      pending = phase
      requestAnimationFrame(() => {
        const channel = new MessageChannel()

        phase.frameMs = performance.now() - start
        channel.port1.onmessage = () => {
          phase.doneMs = performance.now() - start
          samples.push(phase.doneMs)
          phases.push(phase)
        }
        channel.port2.postMessage(null)
      })
    },
    true,
  )
}

type TypingPhase = {
  start: number
  handlerMs: number
  mutationMs: number | null
  frameMs: number
  doneMs: number
}

export const runBench = async (adapter: EditorAdapter | null) => {
  const params = new URLSearchParams(location.search)
  // file - настоящий файл из соседнего проекта (его отдаёт main.cjs), иначе - генератор.
  const file = params.get('file')
  const text = file
    ? await (await fetch(`../files/${file}`)).text()
    : generateTypeScript(Number(params.get('lines') ?? '1000'))
  const jsx = file?.endsWith('.tsx') ?? false
  const element = document.getElementById('editor') as HTMLElement
  const mountStart = performance.now()

  await adapter?.mount(element, text, jsx)
  await nextPaint()

  const readyAt = performance.now()
  const samples: number[] = []
  const phases: TypingPhase[] = []

  watchTyping(samples, phases)

  window.__bench = {
    // readyMs - от начала навигации: загрузка и разбор кода движка плюс создание.
    ready: { readyMs: readyAt, mountMs: readyAt - mountStart, textLength: text.length },
    prepareTyping: (fraction: number) => {
      adapter?.moveCursorTo(fraction)
      adapter?.focus()
      samples.length = 0
      phases.length = 0

      return adapter?.length() ?? 0
    },
    typingSamples: () => [...samples],
    typingPhases: () => phases.slice(5, 15),
    hasFocus: () => document.hasFocus(),
    length: () => adapter?.length() ?? 0,
    jumpToEnd: async () => {
      const start = performance.now()

      adapter?.moveCursorToEnd()
      await nextPaint()

      return performance.now() - start
    },
    heap: () => {
      ;(globalThis as { gc?: () => void }).gc?.()

      return (
        (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize ?? null
      )
    },
  }
}
