/**
 * Путь от корня проекта: имя файла отдельно, папка над ним отдельно, без слеша на
 * конце. Файл в корне - папка пустая. Нужно редактору (шапка файла) и поиску.
 */
export const splitPath = (path: string): { folder: string; name: string } => {
  const slash = path.lastIndexOf('/')

  return { folder: slash < 0 ? '' : path.slice(0, slash), name: path.slice(slash + 1) }
}
