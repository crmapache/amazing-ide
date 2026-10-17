import type { ProjectFileList, TextSearchResult } from '@shared/search'

import { listProjectFiles } from './project-files'
import { searchText } from './text-search'

/**
 * Поиск Search Everywhere. Состояние одно - незаконченный поиск текста: окно ищет
 * на каждое нажатие, и устаревший поиск не должен держать git и диск, пока идёт
 * новый. Окно у IDE одно, поэтому и поиск в работе один на всё приложение.
 */
export class SearchService {
  private running: AbortController | null = null

  listFiles(rootPath: string): Promise<ProjectFileList> {
    return listProjectFiles(rootPath)
  }

  /** Отменяет предыдущий незаконченный поиск: его ответ - то, что он успел найти. */
  async findText(rootPath: string, query: string): Promise<TextSearchResult> {
    this.running?.abort()

    const controller = new AbortController()

    this.running = controller

    try {
      return await searchText(rootPath, query, controller.signal)
    } finally {
      if (this.running === controller) this.running = null
    }
  }
}
