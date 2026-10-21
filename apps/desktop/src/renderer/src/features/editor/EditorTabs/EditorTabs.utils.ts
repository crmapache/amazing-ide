/**
 * Подписи вкладок: имя файла, а у одноимённых - с папками над ним, ровно столько, чтобы
 * различались: `index.ts` и `index.ts` становятся `editor/index.ts` и `tabs/index.ts`.
 */
export const tabLabels = (paths: readonly string[]): Map<string, string> => {
  const parts = new Map(paths.map((path) => [path, path.split('/')]))
  const labels = new Map<string, string>()
  const suffix = (path: string, depth: number) => (parts.get(path) ?? []).slice(-depth).join('/')

  for (const path of paths) {
    const segments = parts.get(path) ?? []
    let depth = 1

    while (
      depth < segments.length &&
      paths.some((other) => other !== path && suffix(other, depth) === suffix(path, depth))
    ) {
      depth += 1
    }

    labels.set(path, suffix(path, depth))
  }

  return labels
}
