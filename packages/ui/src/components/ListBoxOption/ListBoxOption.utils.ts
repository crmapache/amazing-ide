import type { TextRange, TextSegment } from './ListBoxOption.types'

/**
 * Режет текст на обычные и подсвеченные куски. Места могут прийти в любом порядке,
 * пересекаться и вылезать за конец текста - склеиваются и обрезаются здесь, а не у
 * того, кто их нашёл.
 */
export const splitByRanges = (text: string, ranges: readonly TextRange[]): TextSegment[] => {
  const marked = new Array<boolean>(text.length).fill(false)

  for (const { start, length } of ranges) {
    for (let index = Math.max(0, start); index < Math.min(text.length, start + length); index++) {
      marked[index] = true
    }
  }

  const segments: TextSegment[] = []

  for (let index = 0; index < text.length; index++) {
    const isMatch = marked[index] ?? false
    const last = segments.at(-1)

    if (last && last.isMatch === isMatch) last.text += text[index]
    else segments.push({ text: text[index] ?? '', isMatch })
  }

  return segments
}
