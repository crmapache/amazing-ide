import { create } from 'zustand'

import { documentKey } from './documents.utils'
import type { DocumentStatus } from './editor.types'

type EditorStore = {
  /** Состояние открытых файлов по ключу документа. Пишут документы редактора. */
  statuses: Record<string, DocumentStatus>
  /** Растёт на просьбу отдать клавиатуру редактору: выбрали вкладку мышью. */
  focusSerial: number
  setStatus: (key: string, status: DocumentStatus | null) => void
  requestFocus: () => void
}

const LOADING: DocumentStatus = { kind: 'loading' }

/**
 * Интерфейсное состояние редактора, которое видно без Monaco: полоса вкладок метит файл
 * с вопросом, середина окна показывает «не текст». Сам текст и правки - в моделях Monaco
 * (documents.ts), сюда они не копируются.
 */
export const useEditorStore = create<EditorStore>()((set) => ({
  statuses: {},
  focusSerial: 0,
  setStatus: (key, status) =>
    set((state) => {
      const { [key]: _previous, ...rest } = state.statuses

      return { statuses: status ? { ...rest, [key]: status } : rest }
    }),
  requestFocus: () => set((state) => ({ focusSerial: state.focusSerial + 1 })),
}))

/** Состояние файла проекта. Ещё не открывали - «читается»: документ вот-вот появится. */
export const useDocumentStatus = (projectId: string, path: string): DocumentStatus =>
  useEditorStore((state) => state.statuses[documentKey(projectId, path)] ?? LOADING)

/** Вопрос к файлу (конфликт, удалён, не записался) или null. */
export const useDocumentNotice = (projectId: string, path: string) =>
  useEditorStore((state) => {
    const status = state.statuses[documentKey(projectId, path)]

    return status?.kind === 'text' ? status.notice : null
  })
