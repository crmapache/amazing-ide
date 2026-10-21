/** Запись дерева коммита из `git ls-tree -z -l`: что это, его объект, размер и имя. */
export type TreeEntry = {
  type: 'blob' | 'tree' | 'commit'
  oid: string
  /** Размер в байтах; у папки и подмодуля его нет. */
  size: number | null
  path: string
}

const TYPES: ReadonlySet<string> = new Set(['blob', 'tree', 'commit'])

/**
 * Разбор `git ls-tree -z -l`: записи через \0, в записи - «режим тип объект размер», таб и
 * путь. Путь после таба берётся целиком: в нём бывают пробелы и табы. Неразборчивое
 * пропускается.
 */
export const parseTreeEntries = (stdout: string): TreeEntry[] =>
  stdout.split('\0').flatMap((record) => {
    const tab = record.indexOf('\t')

    if (tab < 0) return []

    const [, type = '', oid = '', size = ''] = record.slice(0, tab).trim().split(/\s+/)

    if (!TYPES.has(type) || oid === '') return []

    return [
      {
        type: type as TreeEntry['type'],
        oid,
        size: /^\d+$/.test(size) ? Number(size) : null,
        path: record.slice(tab + 1),
      },
    ]
  })
