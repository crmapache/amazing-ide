import { useTranslation } from 'react-i18next'

import type { IndicatorId } from '@shared/claude-prefs'

import { Card } from '@amazing-ide/ui/Card'
import { Switch } from '@amazing-ide/ui/Switch'

import { useClaudeActions } from '../claude-actions.hooks'
import { usePanelPrefs, useClaudeState } from '../claude.queries'
import { PanelScreen } from '../PanelScreen/PanelScreen'
import { ABOVE_FIELD, BELOW_FIELD } from './IndicatorsScreen.constants'
import styles from './IndicatorsScreen.module.scss'
import { weeklyModel, toggleHidden } from './IndicatorsScreen.utils'

/**
 * Показания вокруг поля ввода (Settings → Indicators), по выключателю на каждое: два над
 * полем и всё, что в строке под ним. Образца нет: выключатели действуют на саму панель,
 * и строка под полем видна, как только меню закрыто.
 */
export const IndicatorsScreen = () => {
  const { t } = useTranslation()
  const prefs = usePanelPrefs()
  const { data: state } = useClaudeState()
  const { setPrefs } = useClaudeActions()
  const model = weeklyModel(state?.accounts.usage[state.accounts.current])

  const labelOf = (id: IndicatorId) =>
    id === 'ringModel' && model
      ? t('claudeCode.indicators.modelNamed', { model })
      : t(`claudeCode.indicators.items.${id}.label`)

  const renderSwitch = (id: IndicatorId) => (
    <Switch
      key={id}
      label={labelOf(id)}
      description={t(`claudeCode.indicators.items.${id}.hint`)}
      checked={!prefs.hiddenIndicators.includes(id)}
      onChange={() => void setPrefs({ hiddenIndicators: toggleHidden(prefs.hiddenIndicators, id) })}
    />
  )

  return (
    <PanelScreen title={t('claudeCode.menu.titles.indicators.title')}>
      <Card title={t('claudeCode.indicators.above')}>
        <div className={styles.list}>{ABOVE_FIELD.map(renderSwitch)}</div>
      </Card>
      <Card title={t('claudeCode.indicators.below')}>
        <div className={styles.list}>{BELOW_FIELD.map(renderSwitch)}</div>
      </Card>
    </PanelScreen>
  )
}
