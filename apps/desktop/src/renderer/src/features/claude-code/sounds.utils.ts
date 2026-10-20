import type { PanelPrefs, SoundEvent, ConversationCall } from '@shared/claude-prefs'
import { SOUND_PRIORITY, DEFAULT_SOUND_VOLUME } from '@shared/claude-prefs'

import { SOUND_GAP_MS } from './sounds.constants'

/** Галочки и громкости звуков - то, что меняет экран Sound alerts. */
export type SoundPrefs = Pick<PanelPrefs, 'mutedSounds' | 'soundVolumes'>

/** Последний сыгравший звук: когда и насколько он был важен. */
export type LastSound = { at: number; rank: number }

/** Громкость повода, проценты; не трогали - по умолчанию. */
export const volumeOf = (prefs: SoundPrefs, event: SoundEvent): number =>
  prefs.soundVolumes[event] ?? DEFAULT_SOUND_VOLUME

export const isSoundOn = (prefs: SoundPrefs, event: SoundEvent): boolean =>
  !prefs.mutedSounds.includes(event)

const withVolume = (
  volumes: SoundPrefs['soundVolumes'],
  event: SoundEvent,
  volume: number | null,
): SoundPrefs['soundVolumes'] => {
  const { [event]: _previous, ...rest } = volumes

  return volume === null ? rest : { ...rest, [event]: volume }
}

/**
 * Галочка. Выключенный звук помнит громкость: включая обратно, ждут свои прежние
 * проценты. Исключение - звук, выключенный самим ползунком в ноль: вернуть «как было»
 * значило бы вернуть тишину, поэтому он включается на громкости по умолчанию.
 */
export const toggleSound = (prefs: SoundPrefs, event: SoundEvent): SoundPrefs => {
  if (isSoundOn(prefs, event)) return { ...prefs, mutedSounds: [...prefs.mutedSounds, event] }

  return {
    mutedSounds: prefs.mutedSounds.filter((item) => item !== event),
    soundVolumes:
      volumeOf(prefs, event) === 0
        ? withVolume(prefs.soundVolumes, event, null)
        : prefs.soundVolumes,
  }
}

/**
 * Громкость с ползунка - он же галочка: ноль и «выключено» - одно и то же. Утянутый в
 * ноль выключает звук, поднятый обратно - включает. Громкость по умолчанию не
 * хранится: тишина в настройках и значит «как есть».
 */
export const setSoundVolume = (
  prefs: SoundPrefs,
  event: SoundEvent,
  volume: number,
): SoundPrefs => {
  const value = Math.min(100, Math.max(0, Math.round(volume)))
  const others = prefs.mutedSounds.filter((item) => item !== event)

  return {
    mutedSounds: value === 0 ? [...others, event] : others,
    soundVolumes: withVolume(
      prefs.soundVolumes,
      event,
      value === DEFAULT_SOUND_VOLUME ? null : value,
    ),
  }
}

/** Важность повода: меньше - важнее (SOUND_PRIORITY). */
export const soundRank = (event: SoundEvent): number => SOUND_PRIORITY.indexOf(event)

/**
 * Слышен ли звук сразу за предыдущим. Подряд молчит менее важный, а не тот, что опоздал
 * на миллисекунду: два сигнала подряд лучше, чем не услышать главный.
 */
export const passesGap = (last: LastSound | null, event: SoundEvent, now: number): boolean =>
  last === null || now - last.at >= SOUND_GAP_MS || soundRank(event) < last.rank

/**
 * Смотрит ли человек прямо на эту вкладку: окно впереди, панель Claude Code открыта и
 * вкладка выбрана в активном проекте. Тогда звать звуком незачем - ровно туда он и
 * смотрит. Фоновая вкладка, свёрнутое окно, закрытая панель - звук нужен.
 */
export const isWatched = (
  call: ConversationCall,
  view: { activeConversationId: string | null; panelShown: boolean; windowFocused: boolean },
): boolean =>
  view.windowFocused && view.panelShown && view.activeConversationId === call.conversationId
