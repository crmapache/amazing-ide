import type { editor, IDisposable } from 'monaco-editor/editor/editor.api.js'

import { DIFF_COMPARE_WAIT_MS, DIFF_COMPARING_ATTRIBUTE } from './editor.constants'

/** Что нужно от разницы Monaco: событие пересчёта, его итог и переход к первой правке. */
type ComparedDiff = Pick<
  editor.IStandaloneDiffEditor,
  'onDidUpdateDiff' | 'getLineChanges' | 'revealFirstDiff'
>

/** Что нужно от места разницы: признак «ещё сравнивается» (стили прячут по нему). */
type DiffHost = Pick<Element, 'setAttribute' | 'removeAttribute'>

/**
 * Новая пара сторон показывается, когда Monaco её сравнил: неизменённое он сворачивает только
 * по итогу сравнения, и до него файл мелькнул бы целиком. Показ - у первой правки и кадром
 * позже, когда Monaco уже нарисовал свёрнутое. Сравнение затянулось (огромный файл, очередь
 * воркера, сбой) - пара показывается как есть, а поздний итог её уже не двигает: человек мог
 * начать в ней работать. Отписка показывает пару, если она ещё спрятана.
 */
export const showWhenCompared = (diff: ComparedDiff, host: DiffHost): IDisposable => {
  let frame: number | null = null
  const show = () => host.removeAttribute(DIFF_COMPARING_ATTRIBUTE)
  const waiting = {
    compared: diff.onDidUpdateDiff(() => {
      if (diff.getLineChanges() === null) return

      stopWaiting()
      diff.revealFirstDiff()
      frame = window.requestAnimationFrame(show)
    }),
    timer: window.setTimeout(() => {
      stopWaiting()
      show()
    }, DIFF_COMPARE_WAIT_MS),
  }
  const stopWaiting = () => {
    waiting.compared.dispose()
    window.clearTimeout(waiting.timer)
  }

  host.setAttribute(DIFF_COMPARING_ATTRIBUTE, '')

  return {
    dispose: () => {
      stopWaiting()
      if (frame !== null) window.cancelAnimationFrame(frame)
      show()
    },
  }
}
