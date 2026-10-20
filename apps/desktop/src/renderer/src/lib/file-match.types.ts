import type { FuzzyMatch } from './fuzzy-match.types'

/** Файл проекта, заранее разобранный для поиска: имя отдельно, нижний регистр готов. */
export type PreparedFile = {
  path: string
  name: string
  folder: string
  pathLower: string
  nameLower: string
}

/** Файл под запрос и его совпадение. */
export type FileMatch = { file: PreparedFile; match: FuzzyMatch }
