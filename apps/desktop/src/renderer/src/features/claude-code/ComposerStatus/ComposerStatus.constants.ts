import type { LucideIcon } from 'lucide-react'
import { Zap, FilePen, ShieldOff, ShieldCheck, ClipboardList } from 'lucide-react'

import type { ModelInfo, PermissionMode } from '@shared/claude'

import { MINUTE_MS } from '../claude.constants'
import type { ModeTone } from './ComposerStatus.types'

/** Иконка режима разрешений в кнопке и в меню. */
export const MODE_ICONS: Record<PermissionMode, LucideIcon> = {
  default: ShieldCheck,
  acceptEdits: FilePen,
  plan: ClipboardList,
  auto: Zap,
  bypassPermissions: ShieldOff,
}

/**
 * Тон иконки режима: обычный - тихий, план - мятный (только смотрит), принятие правок -
 * оранжевый (внимание: правки идут без вопроса), без вопросов вовсе - красный.
 */
export const MODE_TONES: Record<PermissionMode, ModeTone> = {
  default: 'quiet',
  acceptEdits: 'accent',
  plan: 'info',
  auto: 'accent',
  bypassPermissions: 'danger',
}

/** Значение каталога CLI «модель по умолчанию» - в панели это «как в настройках». */
export const DEFAULT_MODEL_VALUE = 'default'

/** Сколько моделей каталога показывать сразу; остальные - в свёрнутой группе. */
export const MAIN_MODELS = 5

/**
 * Модели, пока CLI не прислал свой каталог (до первого хода в IDE). Имена - данные
 * CLI, а не текст интерфейса: их не переводят.
 */
export const FALLBACK_MODELS: readonly ModelInfo[] = [
  { value: 'opus', displayName: 'Opus', description: '' },
  { value: 'fable', displayName: 'Fable', description: '' },
  { value: 'sonnet', displayName: 'Sonnet', description: '' },
  { value: 'haiku', displayName: 'Haiku', description: '' },
]

/** Как часто освежать токены за день: главный процесс дочитывает только дописанное. */
export const TODAY_TOKENS_REFRESH_MS = MINUTE_MS
