import { lazy } from 'react'

/**
 * Редактор с Monaco - отдельным куском: окно стартует без него, а грузится он к первому
 * открытому файлу (ADR 0005). Полоса вкладок и пустые состояния от него не зависят.
 */
export const CodeEditor = lazy(() =>
  import('../CodeEditor/CodeEditor').then((module) => ({ default: module.CodeEditor })),
)
