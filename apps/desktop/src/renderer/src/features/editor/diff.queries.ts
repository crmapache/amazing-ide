import type { GitHeadFile } from '@shared/git'
import { useQuery } from '@tanstack/react-query'

import { preloadLanguage } from '../../lib/highlighter'
import { invoke } from '../../lib/ipc'
import { languageOfPath } from '../../lib/syntax-languages.utils'
import { QUERY_KEYS } from '../../state/query-keys'

/**
 * Файл, каким он лежит в последнем коммите, - левая сторона разницы. Читается один раз;
 * коммит, смена ветки и reset сбрасывают все файлы проекта разом (useEditorSync). Язык
 * подсветки грузится заранее, как у документа: модель, созданная до грамматики, мигнула бы
 * ровным текстом. path null - левой стороны нет (новый файл): читать нечего.
 */
export const useHeadFile = (projectId: string, path: string | null): GitHeadFile | undefined =>
  useQuery({
    queryKey: QUERY_KEYS.gitHeadFile(projectId, path ?? ''),
    queryFn: async () => {
      const file = await invoke('git:readHeadFile', { projectId, path: path ?? '' })
      const language = languageOfPath(path ?? '')

      if (file.kind === 'text' && language) await preloadLanguage(language).catch(() => undefined)

      return file
    },
    enabled: path !== null,
    staleTime: Infinity,
  }).data
