import type { GitStatus, GitPathStatus } from '@shared/git'

import { ancestorPaths } from './file-tree.utils'

/** Своё поле словаря: файл «constructor» не должен найти Object из прототипа. */
const own = <T>(map: Record<string, T>, key: string): T | undefined =>
  Object.hasOwn(map, key) ? map[key] : undefined

/**
 * Цвет строки дерева по git, как в WebStorm: свой статус пути; иначе - статус папки над
 * ним, если она целиком новая или игнорируемая (ближняя важнее); папка, внутри которой
 * есть изменения, - изменена или в конфликте. Подмодуль git отдаёт без «/», как файл.
 * diskPath - путь строки в том регистре, что на диске.
 */
export const treeStatusOf = (
  status: GitStatus | null | undefined,
  diskPath: string,
  isDirectory: boolean,
): GitPathStatus | null => {
  if (!status) return null

  // Репозиторий без регистра хранит ключи в нижнем: путь с диска - туда же.
  const relativePath = status.ignoreCase ? diskPath.toLowerCase() : diskPath

  const ownStatus = isDirectory
    ? (own(status.folders, relativePath) ?? own(status.files, relativePath))
    : own(status.files, relativePath)

  if (ownStatus) return ownStatus

  for (const folder of [...ancestorPaths(relativePath).reverse(), '']) {
    const folderStatus = own(status.folders, folder)

    if (folderStatus) return folderStatus
  }

  return isDirectory ? (own(status.changedFolders, relativePath) ?? null) : null
}
