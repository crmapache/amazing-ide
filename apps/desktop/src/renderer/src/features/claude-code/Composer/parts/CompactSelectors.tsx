import styles from '../Composer.module.scss'
import type { CompactSelectorsProps } from '../Composer.types'
import { usePanelPrefs } from '../../claude.queries'
import { EffortPicker } from '../../ComposerStatus/parts/EffortPicker'
import { ModelPicker } from '../../ComposerStatus/parts/ModelPicker'
import { ModePicker } from '../../ComposerStatus/parts/ModePicker'
import { UsageRings } from '../../ComposerStatus/parts/UsageRings'

/**
 * Ужатая раскладка (Settings → Composer layout → Compact): строки под полем нет, MODEL,
 * EFFORT, MODE и кольца лимитов едут в ряд кнопок поля - ленте остаётся больше высоты.
 */
export const CompactSelectors = ({ conversation }: CompactSelectorsProps) => {
  const { hiddenIndicators } = usePanelPrefs()

  return (
    <div className={styles.compactSelectors}>
      <ModelPicker conversation={conversation} />
      <EffortPicker conversation={conversation} />
      <ModePicker conversation={conversation} />
      <UsageRings hidden={hiddenIndicators} />
    </div>
  )
}
