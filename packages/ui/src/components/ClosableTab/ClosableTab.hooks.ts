import { useRef, useState, useLayoutEffect } from 'react'

import { ELLIPSIS } from './ClosableTab.constants'
import { fitMiddle } from './ClosableTab.utils'

/** Ширина многоточия по шрифту - меряется один раз на шрифт: этого знака в имени нет. */
const ellipsisWidths = new Map<string, number>()

const ellipsisWidth = (font: string): number => {
  const known = ellipsisWidths.get(font)

  if (known !== undefined) return known

  const context = document.createElement('canvas').getContext('2d')

  if (!context) return 0

  context.font = font

  const width = context.measureText(ELLIPSIS).width

  ellipsisWidths.set(font, width)

  return width
}

/**
 * Имя вкладки, обрезанное посередине (fitMiddle). Имени два: невидимое целое в потоке -
 * по нему вкладка ширится и его меряют, и видимое поверх - как влезает. Пересчёт - на
 * любую смену ширины (соседи, ширина панели) и когда догрузился шрифт. isCut - имя
 * обрезано: только тогда подсказка с полным именем что-то добавляет.
 */
export const useMiddleCut = (title: string) => {
  const boxRef = useRef<HTMLSpanElement>(null)
  const wholeRef = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(title)

  useLayoutEffect(() => {
    const box = boxRef.current
    const text = wholeRef.current?.firstChild

    if (!box || !(text instanceof Text)) return

    const range = document.createRange()
    const measure = (from: number, to: number) => {
      range.setStart(text, from)
      range.setEnd(text, to)

      return range.getBoundingClientRect().width
    }
    const fit = () => {
      const room = box.getBoundingClientRect().width

      setShown(fitMiddle(title, room, measure, ellipsisWidth(getComputedStyle(box).font)))
    }
    const observer = new ResizeObserver(fit)
    let live = true

    fit()
    observer.observe(box)
    void document.fonts.ready.then(() => {
      if (live) fit()
    })

    return () => {
      live = false
      observer.disconnect()
    }
  }, [title])

  return { boxRef, wholeRef, shown, isCut: shown !== title }
}
