import { useState } from 'react'
import { History, GitCompare, LayoutDashboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@amazing-ide/ui/Avatar'
import { Badge } from '@amazing-ide/ui/Badge'
import { Button } from '@amazing-ide/ui/Button'
import { Kbd } from '@amazing-ide/ui/Kbd'
import { Tabs } from '@amazing-ide/ui/Tabs'

import { KBD_SAMPLES, BADGE_SAMPLES, AVATAR_SAMPLES } from '../ComponentsView.constants'
import type { SampleTabId } from '../ComponentsView.types'
import { ShowcaseSection } from '../../ShowcaseSection/ShowcaseSection'
import { Specimen } from '../../Specimen/Specimen'
import { useGrowthFlash } from '../../../../lib/growth-flash.hooks'

/** Раздел «Индикаторы»: значки проектов, метки состояния, сочетания клавиш, вкладки. */
export const IndicatorsSection = () => {
  const { t } = useTranslation('showcase')
  const [tab, setTab] = useState<SampleTabId>('overview')
  const [historyCount, setHistoryCount] = useState(3)
  const historyFlash = useGrowthFlash(historyCount)

  const tabs = [
    { id: 'overview', label: t('samples.overview'), icon: LayoutDashboard },
    { id: 'changes', label: t('samples.changes'), icon: GitCompare },
    { id: 'history', label: t('samples.history'), icon: History },
  ] as const
  // Разделы найденного: счётчик с нуля (тусклый) и с находкой, подсказка - клавиша раздела.
  // Счётчик, выросший от кнопки рядом, вспыхивает (flash).
  const countedTabs = [
    { id: 'overview', label: t('samples.overview'), count: 12, hint: '⌥⌘1' },
    { id: 'changes', label: t('samples.changes'), count: 0, hint: '⌥⌘2' },
    {
      id: 'history',
      label: t('samples.history'),
      count: historyCount,
      flash: historyFlash,
      hint: '⌥⌘3',
    },
  ] as const

  const handleGrow = () => setHistoryCount((count) => count + 1)

  return (
    <ShowcaseSection title={t('sections.indicators')}>
      <Specimen label={t('specimens.avatars')}>
        {AVATAR_SAMPLES.map(({ tone, initials }) => (
          <Avatar key={tone} tone={tone} initials={initials} />
        ))}
      </Specimen>

      <Specimen label={t('specimens.badgeMarkers')}>
        {BADGE_SAMPLES.map(({ tone, labelKey }) => (
          <Badge key={tone} tone={tone}>
            {t(labelKey)}
          </Badge>
        ))}
      </Specimen>

      <Specimen label={t('specimens.badgeSoft')}>
        {BADGE_SAMPLES.map(({ tone, labelKey }) => (
          <Badge key={tone} tone={tone} variant="soft">
            {t(labelKey)}
          </Badge>
        ))}
      </Specimen>

      <Specimen label={t('specimens.kbd')}>
        {KBD_SAMPLES.map((keys) => (
          <Kbd key={keys.join('+')} keys={keys} />
        ))}
      </Specimen>

      <Specimen label={t('specimens.tabs')}>
        <Tabs label={t('samples.tabsLabel')} items={tabs} value={tab} onChange={setTab} />
        <Tabs label={t('samples.tabsLabel')} items={countedTabs} value={tab} onChange={setTab} />
        <Button size="sm" variant="ghost" onClick={handleGrow}>
          {t('samples.countGrow')}
        </Button>
      </Specimen>
    </ShowcaseSection>
  )
}
