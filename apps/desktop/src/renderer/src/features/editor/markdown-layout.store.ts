import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { isMarkdownPath } from '../../lib/syntax-languages.utils'
import { documentKey } from './documents.utils'
import type { MarkdownLayout } from './editor.types'
import {
  SPLIT_RATIO_MAX,
  SPLIT_RATIO_MIN,
  SPLIT_RATIO_DEFAULT,
  DEFAULT_MARKDOWN_LAYOUT,
  MARKDOWN_LAYOUT_STORAGE_KEY,
} from './markdown-layout.constants'

type MarkdownLayoutStore = {
  /** Вид каждого файла, на котором его выбирали, - пока окно живо. */
  byFile: Record<string, MarkdownLayout>
  /** Вид, выбранный последним: так открывается файл, на котором вид ещё не выбирали. */
  preferred: MarkdownLayout
  /** Доля ширины под код, когда рядом просмотр. */
  splitRatio: number
  /** Человек выбрал вид: и этому файлу, и следующим. */
  choose: (projectId: string, path: string, layout: MarkdownLayout) => void
  /**
   * Перейти к строке файла, открытого одним просмотром: код встаёт рядом, иначе строку
   * не увидеть. Выбор человека по умолчанию не меняется.
   */
  reveal: (projectId: string, path: string) => void
  setSplitRatio: (ratio: number) => void
}

const LAYOUTS: ReadonlySet<unknown> = new Set<MarkdownLayout>(['editor', 'split', 'preview'])

const clampRatio = (ratio: number) => Math.min(SPLIT_RATIO_MAX, Math.max(SPLIT_RATIO_MIN, ratio))

/** Сохранённое прошлым запуском - только то, что понятно этому: иначе как было. */
const restore = (
  saved: unknown,
): Partial<Pick<MarkdownLayoutStore, 'preferred' | 'splitRatio'>> => {
  const { preferred, splitRatio } = (saved ?? {}) as Record<string, unknown>

  return {
    ...(LAYOUTS.has(preferred) && { preferred: preferred as MarkdownLayout }),
    ...(typeof splitRatio === 'number' &&
      Number.isFinite(splitRatio) && { splitRatio: clampRatio(splitRatio) }),
  }
}

/**
 * Вид файлов Markdown в середине окна: код, код и просмотр, просмотр (как в WebStorm).
 * Между перезапусками помнятся выбранный последним вид и доля ширины под код.
 */
export const useMarkdownLayoutStore = create<MarkdownLayoutStore>()(
  persist(
    (set) => ({
      byFile: {},
      preferred: DEFAULT_MARKDOWN_LAYOUT,
      splitRatio: SPLIT_RATIO_DEFAULT,
      choose: (projectId, path, layout) =>
        set((state) => ({
          byFile: { ...state.byFile, [documentKey(projectId, path)]: layout },
          preferred: layout,
        })),
      reveal: (projectId, path) =>
        set((state) => ({ byFile: { ...state.byFile, [documentKey(projectId, path)]: 'split' } })),
      setSplitRatio: (ratio) => set({ splitRatio: clampRatio(ratio) }),
    }),
    {
      name: MARKDOWN_LAYOUT_STORAGE_KEY,
      partialize: ({ preferred, splitRatio }) => ({ preferred, splitRatio }),
      merge: (saved, current) => ({ ...current, ...restore(saved) }),
    },
  ),
)

/** Как показан файл: у Markdown - выбранный вид, у остальных - всегда код. */
export const useMarkdownLayout = (projectId: string, path: string): MarkdownLayout =>
  useMarkdownLayoutStore((state) =>
    isMarkdownPath(path)
      ? (state.byFile[documentKey(projectId, path)] ?? state.preferred)
      : 'editor',
  )
