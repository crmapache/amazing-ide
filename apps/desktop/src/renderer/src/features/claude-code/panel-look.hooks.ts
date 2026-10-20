import { useEffect } from 'react'

import { GAUGE_VIVID_FULL, TEXT_SIZE_FOLLOW } from '@shared/claude-prefs'

import { usePanelPrefs } from './claude.queries'
import { IDE_TEXT_SIZE } from './panel-look.constants'

/**
 * Масштаб панели Claude Code по своему размеру текста (Settings → Appearance); undefined
 * - как у IDE. Масштаб, а не кегли: отступы, иконки и чипы растут вместе с текстом.
 * Только поддерево панели - редактор и дерево файлов остаются как есть.
 */
export const usePanelZoom = (): number | undefined => {
  const { textSize } = usePanelPrefs()

  return textSize === TEXT_SIZE_FOLLOW ? undefined : textSize / IDE_TEXT_SIZE
}

/**
 * Спокойные шкалы (Settings → No-stress colors): атрибут и доля цвета на корне
 * документа, потому что подменяются наследуемые роли - кольца во всплывающей панели
 * берут их оттуда же. На сотне атрибута нет вовсе: шкалы носят свои роли как есть.
 */
export const useGaugeCalm = () => {
  const { gaugeVivid } = usePanelPrefs()

  useEffect(() => {
    if (gaugeVivid >= GAUGE_VIVID_FULL) return

    const root = document.documentElement

    root.setAttribute('data-gauge-calm', '')
    root.style.setProperty('--gauge-vivid', `${gaugeVivid}%`)

    return () => {
      root.removeAttribute('data-gauge-calm')
      root.style.removeProperty('--gauge-vivid')
    }
  }, [gaugeVivid])
}
