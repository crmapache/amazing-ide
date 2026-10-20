import type { SoundEvent } from '@shared/claude-prefs'

import extraUsage from './assets/sounds/extra-usage.wav'
import permission from './assets/sounds/permission.wav'
import plan from './assets/sounds/plan.wav'
import question from './assets/sounds/question.wav'
import limit from './assets/sounds/rate-limit.wav'
import error from './assets/sounds/trouble.wav'
import turnDone from './assets/sounds/turn-finished.wav'

/** Файл каждого повода - звуки ACC: набор звуков - часть панели, а не настройки человека. */
export const SOUND_FILES: Record<SoundEvent, string> = {
  turnDone,
  permission,
  question,
  plan,
  limit,
  extraUsage,
  error,
}

/**
 * Окно, в котором звуки подряд сливаются в кашу: следующий в нём слышен, только если
 * он важнее предыдущего (ACC: AlertThrottle). Умерший процесс фоновой вкладки не должен
 * потеряться за соседним «ход закончен».
 */
export const SOUND_GAP_MS = 400
