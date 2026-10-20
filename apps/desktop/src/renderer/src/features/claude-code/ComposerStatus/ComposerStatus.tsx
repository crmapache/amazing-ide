import { usePanelPrefs } from '../claude.queries'
import styles from './ComposerStatus.module.scss'
import type { ComposerStatusProps } from './ComposerStatus.types'
import { EffortPicker } from './parts/EffortPicker'
import { ModelPicker } from './parts/ModelPicker'
import { ModePicker } from './parts/ModePicker'
import { TodayTokens } from './parts/TodayTokens'
import { UsageRings } from './parts/UsageRings'

/**
 * Строка под полем ввода, как в ACC: слева MODEL, EFFORT и MODE разговора, справа кольца
 * лимитов и токены за день. Узкая панель - правый блок уходит на свою
 * строку. Что из показаний видно - решает Settings → Indicators.
 */
export const ComposerStatus = ({ conversation }: ComposerStatusProps) => {
  const { hiddenIndicators } = usePanelPrefs()

  return (
    <div className={styles.composerStatus}>
      <div className={styles.selectors}>
        <ModelPicker conversation={conversation} />
        <EffortPicker conversation={conversation} />
        <ModePicker conversation={conversation} />
      </div>
      <div className={styles.meters}>
        <UsageRings hidden={hiddenIndicators} />
        {!hiddenIndicators.includes('tokensToday') && <TodayTokens />}
      </div>
    </div>
  )
}
