import { useEffect } from 'react'

import { GAUGE_VIVID_FULL } from '@shared/claude-prefs'

import { usePanelPrefs } from './claude.queries'

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
