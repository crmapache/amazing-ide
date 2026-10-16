import type { DirectoryEntry } from '@shared/fs'

export type FileTreeNodeProps = {
  projectId: string
  entry: DirectoryEntry
  /** Глубина вложенности: от неё отступ строки. */
  depth: number
}

export type DirectoryChildrenProps = {
  projectId: string
  relativePath: string
  depth: number
}
