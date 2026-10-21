/**
 * Размер файла словами: «24.6 MB», ровные - без дроби: «20 MB». Общее для редактора
 * (файл больше потолка) и просмотра Markdown (картинка больше потолка).
 */
export const formatSize = (bytes: number): string => {
  const megabytes = bytes / 1024 / 1024

  return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1)} MB`
}
