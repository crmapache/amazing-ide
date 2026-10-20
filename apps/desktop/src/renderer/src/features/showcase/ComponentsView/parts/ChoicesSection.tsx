import { useState } from 'react'
import { Bot, Search, FileText, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@amazing-ide/ui/Button'
import { Card } from '@amazing-ide/ui/Card'
import { ChoiceMark } from '@amazing-ide/ui/ChoiceMark'
import { ClosableTab } from '@amazing-ide/ui/ClosableTab'
import { Disclosure } from '@amazing-ide/ui/Disclosure'
import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'
import { TextField } from '@amazing-ide/ui/TextField'

import { SAMPLE_ICON_SIZE, SAMPLE_ICON_STROKE_WIDTH } from '../ComponentsView.constants'
import styles from '../ComponentsView.module.scss'
import { ShowcaseSection } from '../../ShowcaseSection/ShowcaseSection'
import { Specimen } from '../../Specimen/Specimen'
import { TabStripSpecimen } from './TabStripSpecimen'

/**
 * Раздел «Выбор и раскрытие»: карточка вопроса к человеку, строки-раскрывашки,
 * закрываемые вкладки, варианты выбора с отметкой и меню с полем поиска в шапке.
 */
export const ChoicesSection = () => {
  const { t } = useTranslation('showcase')
  const [isOpen, setIsOpen] = useState(true)
  const [choice, setChoice] = useState('red')
  const [query, setQuery] = useState('')
  const icon = (Icon: typeof Bot) => (
    <Icon size={SAMPLE_ICON_SIZE} strokeWidth={SAMPLE_ICON_STROKE_WIDTH} aria-hidden />
  )

  return (
    <ShowcaseSection title={t('sections.choices')}>
      <Specimen label={t('specimens.cardAccent')} layout="column">
        <Card tone="accent" icon={ShieldAlert} title={t('samples.permission')}>
          {t('samples.permissionText')}
          <div className={styles.cardBadges}>
            <Button variant="primary" size="sm">
              {t('samples.allow')}
            </Button>
            <Button variant="ghost" size="sm">
              {t('samples.deny')}
            </Button>
          </div>
        </Card>
      </Specimen>

      <Specimen label={t('specimens.disclosure')} layout="column">
        <div className={styles.stack}>
          <Disclosure expanded={isOpen} onClick={() => setIsOpen((value) => !value)}>
            {icon(FileText)}
            {t('samples.disclosureRow')}
          </Disclosure>
          <Disclosure expanded={false} disabled>
            {icon(Search)}
            {t('samples.disclosureEmpty')}
          </Disclosure>
          <Disclosure size="md" expanded={false}>
            {icon(Bot)}
            {t('samples.disclosureCard')}
          </Disclosure>
        </div>
      </Specimen>

      <Specimen label={t('specimens.closableTabs')} layout="column">
        <div role="tablist" aria-label={t('specimens.closableTabs')} className={styles.tabStrip}>
          <ClosableTab
            label={t('samples.project')}
            hint={t('samples.currentPath')}
            active
            closeLabel={t('samples.close')}
            onActivate={() => undefined}
            onClose={() => undefined}
          />
          <ClosableTab
            label={t('samples.otherItem')}
            hint={t('samples.otherPath')}
            active={false}
            closeLabel={t('samples.close')}
            onActivate={() => undefined}
            onClose={() => undefined}
          />
          <ClosableTab
            width="fit"
            label={t('samples.chatTitle')}
            hint={t('samples.chatTitle')}
            active={false}
            closeLabel={t('samples.close')}
            onActivate={() => undefined}
            onClose={() => undefined}
          />
        </div>
      </Specimen>

      <TabStripSpecimen />

      <Specimen label={t('specimens.choiceMarks')}>
        <ChoiceMark shape="circle" checked={false} />
        <ChoiceMark shape="circle" checked />
        <ChoiceMark shape="square" checked={false} />
        <ChoiceMark shape="square" checked />
        <ChoiceMark shape="square" tone="success" checked />
      </Specimen>

      <Specimen label={t('specimens.menuChoices')} layout="column">
        <div className={styles.menuBox}>
          <Menu
            label={t('samples.menuLabel')}
            header={
              <TextField
                label={t('samples.search')}
                hideLabel
                icon={Search}
                value={query}
                placeholder={t('samples.search')}
                onChange={setQuery}
              />
            }>
            <MenuItem
              selection="single"
              checked={choice === 'red'}
              label={t('samples.red')}
              description={t('samples.redHint')}
              onSelect={() => setChoice('red')}
            />
            <MenuItem
              selection="single"
              checked={choice === 'blue'}
              label={t('samples.blue')}
              description={t('samples.blueHint')}
              onSelect={() => setChoice('blue')}
            />
          </Menu>
        </div>
      </Specimen>
    </ShowcaseSection>
  )
}
