import { useState } from 'react'
import { History, GitCompare, LayoutDashboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@amazing-ide/ui/Avatar'
import { Badge } from '@amazing-ide/ui/Badge'
import { Kbd } from '@amazing-ide/ui/Kbd'
import { Tabs } from '@amazing-ide/ui/Tabs'

import { KBD_SAMPLES, BADGE_SAMPLES, AVATAR_SAMPLES } from '../ComponentsView.constants'
import type { SampleTabId } from '../ComponentsView.types'
import { ShowcaseSection } from '../../ShowcaseSection/ShowcaseSection'
import { Specimen } from '../../Specimen/Specimen'

/** Раздел «Индикаторы»: значки проектов, метки состояния, сочетания клавиш, вкладки. */
export const IndicatorsSection = () => {
  const { t } = useTranslation('showcase')
  const [tab, setTab] = useState<SampleTabId>('overview')

  const tabs = [
    { id: 'overview', label: t('samples.overview'), icon: LayoutDashboard },
    { id: 'changes', label: t('samples.changes'), icon: GitCompare },
    { id: 'history', label: t('samples.history'), icon: History },
  ] as const

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
      </Specimen>
    </ShowcaseSection>
  )
}
