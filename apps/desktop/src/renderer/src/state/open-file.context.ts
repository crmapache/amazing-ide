import { useContext, createContext } from 'react'

import type { FilePlace } from './selection.store'

/**
 * Что открыть и где в нём встать. path - как написан: от корня проекта, абсолютный,
 * `~/…` или голое имя (ищется по проекту). exact - путь ровно такой, без поиска по
 * имени (ссылка из просмотра Markdown). Место (строка, колонка, диапазон, find) - из
 * FilePlace: его прочтёт редактор.
 */
export type OpenFileRequest = FilePlace & { path: string; exact?: boolean }

/**
 * Чем кончилось открытие: открыто (файл выбран, папка показана, текст вне проекта открыт
 * вкладкой, остальное вне проекта отдано системе), такого нет на диске, или голое имя нашлось в нескольких местах - тогда
 * candidates (пути от корня) показывают человеку на выбор.
 */
export type OpenFileOutcome =
  { kind: 'opened' } | { kind: 'missing' } | { kind: 'choose'; candidates: string[] }

/** Открыть файл или папку активного проекта. Строка - путь от корня, как раньше. */
export type OpenFile = (request: OpenFileRequest | string) => Promise<OpenFileOutcome>

/**
 * Как открыть файл - знает раскладка окна (выбрать для редактора, раскрыть дерево), а
 * просят об этом фичи, которые друг друга не видят: лента Claude Code, просмотр Markdown.
 * Workbench кладёт сюда настоящее действие, фича берёт его через useOpenFileAction.
 */
export const OpenFileContext = createContext<OpenFile | null>(null)

/** Действие «открыть файл»; null - окно без раскладки (витрина, тест). */
export const useOpenFileAction = () => useContext(OpenFileContext)
