import type { AvatarTone } from '@amazing-ide/ui/Avatar.types'

import { AVATAR_TONES } from './projects.constants'

/**
 * Инициалы проекта, как в WebStorm: первые буквы двух первых слов имени
 * (amazing-ide → AI, roasRadar → RR), у имени из одного слова - две первые буквы.
 */
export const projectInitials = (name: string): string => {
  const words = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
  const [first = '', second] = words
  const initials = second ? `${first[0]}${second[0]}` : first.slice(0, 2)

  return initials.toUpperCase() || '?'
}

/** Цвет значка по имени: один и тот же проект всегда одного цвета. */
export const projectTone = (name: string): AvatarTone => {
  let hash = 0

  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0

  return AVATAR_TONES[hash % AVATAR_TONES.length] ?? 0
}

/** Путь для показа: домашняя папка - через ~, как в WebStorm и терминале. */
export const displayPath = (path: string, homeDir: string | undefined): string =>
  homeDir && (path === homeDir || path.startsWith(`${homeDir}/`))
    ? `~${path.slice(homeDir.length)}`
    : path

/** Папка, в которой лежит путь: рядом с активным проектом кладут клон. */
export const parentFolder = (path: string): string => path.slice(0, path.lastIndexOf('/')) || '/'
