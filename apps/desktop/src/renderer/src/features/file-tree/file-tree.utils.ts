/** Папки, которые надо раскрыть, чтобы увидеть путь: «a/b/c.ts» - «a» и «a/b». */
export const ancestorPaths = (relativePath: string): string[] => {
  const parts = relativePath.split('/').slice(0, -1)

  return parts.map((_, index) => parts.slice(0, index + 1).join('/'))
}
