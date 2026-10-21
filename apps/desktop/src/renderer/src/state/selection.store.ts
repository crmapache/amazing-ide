import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { EDITOR_TABS_LIMIT } from './editor-tabs.constants'
import type { EditorTabs } from './editor-tabs.types'
import { NO_TABS, openTab, activeTab, closeTabs, restoreTabs } from './editor-tabs.utils'

const SELECTION_STORAGE_KEY = 'amazing-ide.selection.v1'

/** Вторая версия - вкладки; первая помнила один выбранный файл проекта. */
const SELECTION_STORAGE_VERSION = 2

const NO_PATHS: readonly string[] = []

/**
 * Где в файле встать, когда его открыли не из дерева: всё с 1, как считает человек.
 * Диапазон (endLine, endColumn) редактор выделяет, конец включительно. find - текст
 * строки, когда номера нет (первая добавленная строка правки): CLI не сообщает, где
 * в файле правка, и место ищет редактор по тексту.
 */
export type FilePlace = {
  line?: number
  column?: number
  endLine?: number
  endColumn?: number
  find?: string
}

type SelectionStore = {
  /** Вкладки файлов каждого проекта: переключил проект - вернулся к своим. */
  tabsByProject: Record<string, EditorTabs>
  /** Где встать в выбранном файле; нет - открыть как есть. */
  selectedPlaceByProject: Record<string, FilePlace | undefined>
  /**
   * Вкладки, которые нельзя закрыть молча: в них несохранённое (конфликт с диском,
   * отказ записи). Пишет редактор, переполнение полосы их пропускает.
   */
  heldByProject: Record<string, readonly string[]>
  /** Растёт на каждый выбор файла, и повторный того же: по нему середина показывает файл. */
  selectSerial: number
  selectFile: (projectId: string, relativePath: string, place?: FilePlace) => void
  closeTabs: (projectId: string, relativePaths: readonly string[]) => void
  setHeld: (projectId: string, relativePaths: readonly string[]) => void
  /** Проекты закрыли - их вкладки больше не нужны: id у открытого заново будет новым. */
  keepProjects: (projectIds: readonly string[]) => void
}

const pick = <T>(record: Record<string, T>, keys: ReadonlySet<string>): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([key]) => keys.has(key)))

/**
 * Какие файлы открыты вкладками и какой из них в редакторе. Общее для дерева файлов
 * (подсветка), редактора (вкладки, что показать и где встать), строки состояния (путь)
 * и панели Claude Code (открытый файл уходит с сообщением), поэтому живёт здесь, а не в
 * одной фиче.
 */
export const useSelectionStore = create<SelectionStore>()(
  persist(
    (set) => ({
      tabsByProject: {},
      selectedPlaceByProject: {},
      heldByProject: {},
      selectSerial: 0,
      // Выбор без места (клик в дереве, во вкладке) сбрасывает место прошлого выбора.
      selectFile: (projectId, relativePath, place) =>
        set((state) => ({
          tabsByProject: {
            ...state.tabsByProject,
            [projectId]: openTab(state.tabsByProject[projectId] ?? NO_TABS, relativePath, {
              limit: EDITOR_TABS_LIMIT,
              held: new Set(state.heldByProject[projectId]),
            }),
          },
          selectedPlaceByProject: { ...state.selectedPlaceByProject, [projectId]: place },
          selectSerial: state.selectSerial + 1,
        })),
      // Место прошлого выбора к открывшейся вместо закрытой вкладке не относится.
      closeTabs: (projectId, relativePaths) =>
        set((state) => ({
          tabsByProject: {
            ...state.tabsByProject,
            [projectId]: closeTabs(state.tabsByProject[projectId] ?? NO_TABS, relativePaths),
          },
          selectedPlaceByProject: { ...state.selectedPlaceByProject, [projectId]: undefined },
        })),
      setHeld: (projectId, relativePaths) =>
        set((state) => ({ heldByProject: { ...state.heldByProject, [projectId]: relativePaths } })),
      keepProjects: (projectIds) =>
        set((state) => {
          const open = new Set(projectIds)

          return {
            tabsByProject: pick(state.tabsByProject, open),
            selectedPlaceByProject: pick(state.selectedPlaceByProject, open),
            heldByProject: pick(state.heldByProject, open),
          }
        }),
    }),
    // Место - просьба этого запуска: после перезапуска файл открывается как есть.
    {
      name: SELECTION_STORAGE_KEY,
      version: SELECTION_STORAGE_VERSION,
      partialize: ({ tabsByProject }) => ({ tabsByProject }),
      // Первая версия помнила один выбранный файл - он становится единственной вкладкой.
      migrate: (persisted, version) => {
        const saved = (persisted ?? {}) as Record<string, Record<string, unknown> | undefined>

        if (version >= SELECTION_STORAGE_VERSION) return saved

        return {
          tabsByProject: Object.fromEntries(
            Object.entries(saved['selectedFileByProject'] ?? {})
              .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
              .map(([projectId, path]) => [projectId, { paths: [path], recent: [path] }]),
          ),
        }
      },
      merge: (persisted, current) => {
        const saved = (persisted as { tabsByProject?: unknown } | undefined)?.tabsByProject
        const entries = typeof saved === 'object' && saved !== null ? Object.entries(saved) : []

        return {
          ...current,
          tabsByProject: Object.fromEntries(
            entries.map(([projectId, tabs]) => [projectId, restoreTabs(tabs)]),
          ),
        }
      },
    },
  ),
)

/** Файл в редакторе проекта - активная вкладка. undefined - вкладок нет. */
export const useSelectedFile = (projectId: string | undefined) =>
  useSelectionStore((state) => (projectId ? activeTab(state.tabsByProject[projectId]) : undefined))

/** Вкладки проекта в порядке на полосе. */
export const useEditorTabs = (projectId: string | undefined): readonly string[] =>
  useSelectionStore((state) =>
    projectId ? (state.tabsByProject[projectId]?.paths ?? NO_PATHS) : NO_PATHS,
  )

/** Где встать в выбранном файле проекта - для редактора. */
export const useSelectedPlace = (projectId: string | undefined) =>
  useSelectionStore((state) => (projectId ? state.selectedPlaceByProject[projectId] : undefined))
