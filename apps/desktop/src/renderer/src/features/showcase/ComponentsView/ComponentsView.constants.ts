import type { FileSample, BadgeSample, AvatarSample } from './ComponentsView.types'

// Инициалы - данные, как у настоящих проектов (projectInitials), а не текст интерфейса.
export const AVATAR_SAMPLES: readonly AvatarSample[] = [
  { tone: 0, initials: 'AI' },
  { tone: 1, initials: 'RR' },
  { tone: 2, initials: 'SM' },
  { tone: 3, initials: 'CC' },
  { tone: 4, initials: 'LG' },
  { tone: 5, initials: 'NS' },
]

export const BADGE_SAMPLES: readonly BadgeSample[] = [
  { tone: 'success', labelKey: 'samples.active' },
  { tone: 'warning', labelKey: 'samples.warning' },
  { tone: 'danger', labelKey: 'samples.failed' },
  { tone: 'info', labelKey: 'samples.indexing' },
  { tone: 'accent', labelKey: 'samples.ahead' },
  { tone: 'neutral', labelKey: 'samples.idle' },
]

// Обозначения клавиш - символы, а не слова: не переводятся.
export const KBD_SAMPLES: readonly (readonly string[])[] = [
  ['⌘', 'K'],
  ['⌘', '⇧', 'P'],
  ['⌥', '↵'],
  ['G', 'G'],
]

export const PROGRESS_SAMPLES: readonly number[] = [0.18, 0.64, 1]

// Иконка рядом с подписью в переключателе ветки - как в шапке окна.
export const SAMPLE_ICON_SIZE = 14

export const SAMPLE_ICON_STROKE_WIDTH = 1.75

// Файлы для образца списка поиска - данные, как у настоящего проекта, не переводятся.
export const FILE_SAMPLES: readonly FileSample[] = [
  { name: 'FileTreeView.tsx', folder: 'features/file-tree/FileTreeView' },
  { name: 'file-tree.store.ts', folder: 'features/file-tree' },
  { name: 'ProjectTabs.tsx', folder: 'features/projects/ProjectTabs' },
  { name: 'tokens.css', folder: 'packages/ui/src/styles' },
]
