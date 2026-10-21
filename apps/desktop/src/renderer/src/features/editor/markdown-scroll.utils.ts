import { ANCHOR_PREFIX } from './markdown-preview.constants'
import type { LineMark } from './markdown-preview.types'

const START: LineMark = { line: 1, top: 0 }

/**
 * Метки по порядку строк, без тех, что стоят выше предыдущей (плавающая картинка, HTML
 * не по порядку): иначе прокрутка прыгала бы назад. Первая метка - начало файла.
 */
export const orderedMarks = (marks: readonly LineMark[]): LineMark[] => {
  const ordered: LineMark[] = [START]

  for (const mark of [...marks].sort((a, b) => a.line - b.line)) {
    const last = ordered.at(-1) ?? START

    if (mark.line > last.line && mark.top >= last.top) ordered.push(mark)
  }

  return ordered
}

/**
 * Высота в просмотре для строки кода (дробной: строка и доля её высоты). Между метками -
 * по доле, как в VS Code: блок в десять строк делит свою высоту в просмотре на десять.
 */
export const topOfLine = (marks: readonly LineMark[], line: number): number => {
  let previous = marks[0] ?? START

  for (const mark of marks) {
    if (mark.line > line) {
      const span = mark.line - previous.line

      return span > 0
        ? previous.top + ((mark.top - previous.top) * (line - previous.line)) / span
        : previous.top
    }

    previous = mark
  }

  return previous.top
}

/** Строка кода (дробная) для высоты в просмотре - обратное к topOfLine. */
export const lineOfTop = (marks: readonly LineMark[], top: number): number => {
  let previous = marks[0] ?? START

  for (const mark of marks) {
    if (mark.top > top) {
      const span = mark.top - previous.top

      return span > 0
        ? previous.line + ((mark.line - previous.line) * (top - previous.top)) / span
        : previous.line
    }

    previous = mark
  }

  return previous.line
}

/** Отступ текста от верха листа: на него встаёт то, к чему прокрутили. */
const sheetInset = (scroll: HTMLElement): number => {
  const sheet = scroll.firstElementChild

  return sheet ? Number.parseFloat(getComputedStyle(sheet).paddingTop) || 0 : 0
}

/**
 * Метки строк в листе просмотра: строка и высота блока за меткой от верха текста. Сама
 * метка размера не имеет - меряется блок, который идёт за ней. Блок скрыт (в свёрнутом
 * <details>) - метки нет.
 */
export const measureMarks = (scroll: HTMLElement): LineMark[] => {
  const origin = scroll.getBoundingClientRect().top - scroll.scrollTop + sheetInset(scroll)
  const marks: LineMark[] = []

  for (const mark of scroll.querySelectorAll<HTMLElement>('[data-line]')) {
    let block = mark.nextElementSibling

    while (block?.hasAttribute('data-line')) block = block.nextElementSibling

    const rect = block?.getBoundingClientRect()

    if (rect && (rect.width > 0 || rect.height > 0)) {
      marks.push({ line: Number(mark.dataset['line']), top: rect.top - origin })
    }
  }

  return marks
}

/**
 * Куда прокрутить лист, чтобы якорь `id` встал наверху; нет такого - null. Пустой якорь
 * и «top» без такого заголовка - начало листа, как у ссылки «наверх» в браузере.
 */
export const anchorTop = (scroll: HTMLElement, id: string): number | null => {
  const target = [id, id.toLowerCase()]
    .filter((candidate) => candidate !== '')
    .map((candidate) => scroll.querySelector(`[id="${CSS.escape(ANCHOR_PREFIX + candidate)}"]`))
    .find((element) => element !== null)

  if (!target) return id === '' || id.toLowerCase() === 'top' ? 0 : null

  return (
    target.getBoundingClientRect().top -
    scroll.getBoundingClientRect().top +
    scroll.scrollTop -
    sheetInset(scroll)
  )
}
