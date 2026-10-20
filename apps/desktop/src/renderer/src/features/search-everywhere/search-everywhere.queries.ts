import type { ProjectFileList } from '@shared/search'
import { useQuery, keepPreviousData } from '@tanstack/react-query'

import { prepareFiles } from '../../lib/file-match.utils'
import { invoke } from '../../lib/ipc'
import { projectFilesQuery } from '../../state/project-files.queries'
import { QUERY_KEYS } from '../../state/query-keys'
import { isTextQuery } from './search-results.utils'

// Вне компонента: React Query пересчитывает select только при новой ссылке на функцию
// или новых данных, а разбор десятков тысяч путей на каждую отрисовку не нужен.
const selectPreparedFiles = (list: ProjectFileList) => ({
  files: prepareFiles(list.paths),
  truncated: list.truncated,
})

/**
 * Все файлы проекта для поиска по имени. Перечитываются при каждом открытии поиска:
 * файлы меняются на диске, а слежения за диском пока нет. Пока идёт запрос, виден
 * прошлый список - искать можно сразу.
 */
export const useProjectFiles = (projectId: string | undefined) =>
  useQuery({
    ...projectFilesQuery(projectId ?? ''),
    enabled: projectId !== undefined,
    select: selectPreparedFiles,
  })

/**
 * Строки проекта с текстом. Слишком короткий или длинный запрос не ищется вовсе. Пока ищется новый
 * запрос, виден ответ на прошлый: список не мигает пустотой на каждую букву.
 */
export const useTextSearch = (projectId: string | undefined, query: string) =>
  useQuery({
    queryKey: QUERY_KEYS.textSearch(projectId ?? '', query),
    queryFn: () => invoke('search:findText', { projectId: projectId ?? '', query }),
    enabled: projectId !== undefined && isTextQuery(query),
    staleTime: 0,
    placeholderData: keepPreviousData,
  })
