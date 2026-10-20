import { queryOptions } from '@tanstack/react-query'

import { invoke } from '../lib/ipc'
import { QUERY_KEYS } from './query-keys'

/**
 * Все файлы проекта (git ls-files или обход без тяжёлых папок): поиск по имени и
 * подсказка упоминаний «@». Перечитываются при каждом открытии - слежения за диском
 * пока нет. Одно определение на всех: кэш общий, разбор - своим select у каждого.
 */
export const projectFilesQuery = (projectId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.projectFiles(projectId),
    queryFn: () => invoke('search:listFiles', { projectId }),
    staleTime: 0,
  })
