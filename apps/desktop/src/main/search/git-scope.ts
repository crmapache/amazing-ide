import { exitCodeOf } from '../git/git-output'
import { git } from '../git/git-runner'

/**
 * Искать ли в папке через git. Да - папка внутри рабочего дерева и сама не
 * игнорируется. Второе важно: если домашняя папка - репозиторий dotfiles с `*` в
 * .gitignore, любой проект без своего .git оказывается «внутри git», где всё
 * игнорируется, и git не нашёл бы в нём ничего. Тогда честнее обойти папку самим.
 *
 * Код выхода check-ignore неоднозначен (1 - «не игнорируется», но и заглушка git
 * без Command Line Tools отвечает 1), поэтому рабочее дерево проверяет rev-parse
 * по ответу, а не по коду.
 */
export const isGitScope = async (rootPath: string): Promise<boolean> => {
  const [insideWorkTree, ignored] = await Promise.all([
    git(rootPath, ['rev-parse', '--is-inside-work-tree']).then(
      ({ stdout }) => stdout.trim() === 'true',
      () => false,
    ),
    git(rootPath, ['check-ignore', '-q', '--', '.']).then(
      () => true,
      (error: unknown) => exitCodeOf(error) !== 1,
    ),
  ])

  return insideWorkTree && !ignored
}
