import { useEffect } from 'react'
import type { RefObject } from 'react'
import type { editor } from 'monaco-editor/editor/editor.api.js'

import type { LineMark } from './markdown-preview.types'
import { lineOfTop, topOfLine, measureMarks, orderedMarks } from './markdown-scroll.utils'
import { monaco } from './monaco-setup'

type Editor = editor.IStandaloneCodeEditor

/**
 * Высоты строки `line` в редакторе: откуда до куда она занимает прокрутку. Первая - от
 * самого верха, вместе с отступом над кодом: прокрутка в ноль - это первая строка.
 */
const lineSpan = (instance: Editor, line: number, count: number): [number, number] => {
  const top = instance.getTopForLineNumber(line)
  const next =
    line < count
      ? instance.getTopForLineNumber(line + 1)
      : top + instance.getOption(monaco.editor.EditorOption.lineHeight)

  return [line === 1 ? 0 : top, next]
}

/** Строка у верха редактора, дробная: номер и доля её высоты над краем. */
const editorTopLine = (instance: Editor): number => {
  const count = instance.getModel()?.getLineCount() ?? 1
  const scrollTop = instance.getScrollTop()
  let low = 1
  let high = count

  while (low < high) {
    const middle = Math.ceil((low + high) / 2)

    if (instance.getTopForLineNumber(middle) <= scrollTop) low = middle
    else high = middle - 1
  }

  const [start, end] = lineSpan(instance, low, count)

  return low + (end > start ? Math.min(1, Math.max(0, (scrollTop - start) / (end - start))) : 0)
}

/** Прокрутить редактор так, чтобы дробная строка встала у верха. */
const scrollEditorTo = (instance: Editor, line: number): void => {
  const count = instance.getModel()?.getLineCount() ?? 1
  const whole = Math.min(count, Math.max(1, Math.floor(line)))
  const [start, end] = lineSpan(instance, whole, count)

  instance.setScrollTop(start + (end - start) * (line - whole), monaco.editor.ScrollType.Immediate)
}

/**
 * Код и просмотр Markdown прокручиваются вместе, как в VS Code: строка у верха редактора
 * - блок у верха листа, между метками строк - по доле. Ведёт тот, кого крутит человек;
 * прокрутка, которую сделала сама сводка, обратно не отражается. Лист поменялся (набрали
 * текст, загрузилась картинка, раскрыли <details>) - метки перемеряются, и лист снова
 * встаёт по коду, если человек крутил код.
 */
export const usePreviewScrollSync = (
  editorRef: RefObject<Editor | null>,
  previewRef: RefObject<HTMLDivElement | null>,
  isActive: boolean,
  /** Документ (documentKey): другой файл - другой лист просмотра, сводка заново. */
  document: string,
) => {
  useEffect(() => {
    const instance = editorRef.current
    const scroll = previewRef.current
    const sheet = scroll?.firstElementChild

    if (!isActive || !instance || !scroll || !sheet) return

    let marks: LineMark[] = []
    let ownPreviewTop = Number.NaN
    let isMovingEditor = false
    let isPreviewLeading = false

    const remeasure = () => {
      const count = instance.getModel()?.getLineCount() ?? 1
      const end = { line: count + 1, top: sheet.getBoundingClientRect().height }

      marks = orderedMarks([...measureMarks(scroll), end])
    }

    const followEditor = () => {
      const before = scroll.scrollTop

      scroll.scrollTop = topOfLine(marks, editorTopLine(instance))
      if (scroll.scrollTop !== before) ownPreviewTop = scroll.scrollTop
    }

    // Monaco сообщает о прокрутке прямо внутри setScrollTop: пока крутит сводка, это эхо,
    // а не человек. Иначе лист, округлённый редактором до целой строки, ехал бы назад.
    const followPreview = () => {
      isMovingEditor = true

      try {
        scrollEditorTo(instance, lineOfTop(marks, scroll.scrollTop))
      } finally {
        isMovingEditor = false
      }
    }

    const handlePreviewScroll = () => {
      if (Math.abs(scroll.scrollTop - ownPreviewTop) < 1) {
        ownPreviewTop = Number.NaN

        return
      }

      isPreviewLeading = true
      followPreview()
    }

    const handleSheetChange = () => {
      remeasure()
      if (!isPreviewLeading) followEditor()
    }

    const editorScroll = instance.onDidScrollChange((event) => {
      if (!event.scrollTopChanged || isMovingEditor) return

      isPreviewLeading = false
      followEditor()
    })
    const modelChange = instance.onDidChangeModel(() => {
      isPreviewLeading = false
      handleSheetChange()
    })
    const resized = new ResizeObserver(handleSheetChange)
    const mutated = new MutationObserver(handleSheetChange)

    resized.observe(sheet)
    mutated.observe(sheet, { childList: true, subtree: true, characterData: true })
    scroll.addEventListener('scroll', handlePreviewScroll, { passive: true })
    handleSheetChange()

    return () => {
      editorScroll.dispose()
      modelChange.dispose()
      resized.disconnect()
      mutated.disconnect()
      scroll.removeEventListener('scroll', handlePreviewScroll)
    }
  }, [editorRef, previewRef, isActive, document])
}
