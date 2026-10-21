import type { GitChangeKind } from '@shared/git'

/**
 * Буква вида изменения справа от строки, как в VS Code и Cursor: цвет имени - язык
 * WebStorm, а буква договаривает то, что цветом не сказать (удалён и переименован).
 */
export const CHANGE_LETTERS: Readonly<Record<GitChangeKind, string>> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  renamed: 'R',
  untracked: 'U',
  conflict: '!',
}
