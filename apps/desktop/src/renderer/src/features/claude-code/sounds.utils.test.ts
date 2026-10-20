import { it, expect, describe } from 'vitest'

import { DEFAULT_SOUND_VOLUME } from '@shared/claude-prefs'

import { SOUND_GAP_MS } from './sounds.constants'
import type { SoundPrefs } from './sounds.utils'
import {
  volumeOf,
  isWatched,
  passesGap,
  soundRank,
  toggleSound,
  setSoundVolume,
} from './sounds.utils'

const none: SoundPrefs = { mutedSounds: [], soundVolumes: {} }

describe('галочка и громкость звука', () => {
  it('выключенный помнит громкость и включается на ней', () => {
    const quiet = setSoundVolume(none, 'plan', 30)
    const off = toggleSound(quiet, 'plan')
    const back = toggleSound(off, 'plan')

    expect(off.mutedSounds).toEqual(['plan'])
    expect(volumeOf(back, 'plan')).toBe(30)
    expect(back.mutedSounds).toEqual([])
  })

  it('ползунок в ноль выключает, а включённый обратно галочкой - не тишина', () => {
    const silent = setSoundVolume(none, 'error', 0)
    const back = toggleSound(silent, 'error')

    expect(silent.mutedSounds).toEqual(['error'])
    expect(volumeOf(back, 'error')).toBe(DEFAULT_SOUND_VOLUME)
  })

  it('поднятый ползунок включает выключенный звук', () => {
    const off = toggleSound(none, 'question')

    expect(setSoundVolume(off, 'question', 40).mutedSounds).toEqual([])
  })

  it('громкость по умолчанию не хранится, края прижимаются', () => {
    expect(setSoundVolume(none, 'plan', DEFAULT_SOUND_VOLUME).soundVolumes).toEqual({})
    expect(volumeOf(setSoundVolume(none, 'plan', 140), 'plan')).toBe(100)
  })
})

describe('звуки подряд', () => {
  const after = (event: Parameters<typeof soundRank>[0]) => ({ at: 1000, rank: soundRank(event) })

  it('в окне молчит не важнее предыдущего, важнее - слышен', () => {
    expect(passesGap(after('turnDone'), 'turnDone', 1100)).toBe(false)
    expect(passesGap(after('error'), 'question', 1100)).toBe(false)
    expect(passesGap(after('turnDone'), 'error', 1100)).toBe(true)
  })

  it('после окна - любой', () => {
    expect(passesGap(after('error'), 'turnDone', 1000 + SOUND_GAP_MS)).toBe(true)
    expect(passesGap(null, 'turnDone', 0)).toBe(true)
  })
})

describe('смотрит ли человек на вкладку', () => {
  const call = { conversationId: 'c1', reason: 'turnDone' as const }
  const view = { activeConversationId: 'c1', panelShown: true, windowFocused: true }

  it('открытая вкладка в окне впереди - звать незачем', () => {
    expect(isWatched(call, view)).toBe(true)
  })

  it('фоновая вкладка, окно сзади, панель закрыта - звук нужен', () => {
    expect(isWatched(call, { ...view, activeConversationId: 'c2' })).toBe(false)
    expect(isWatched(call, { ...view, windowFocused: false })).toBe(false)
    expect(isWatched(call, { ...view, panelShown: false })).toBe(false)
  })
})
