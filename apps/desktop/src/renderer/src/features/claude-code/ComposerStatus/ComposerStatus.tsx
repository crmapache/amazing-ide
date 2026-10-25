import styles from './ComposerStatus.module.scss'
import type { ComposerStatusProps } from './ComposerStatus.types'
import { SetupPicker } from './parts/SetupPicker'
import { TodayTokens } from './parts/TodayTokens'
import { UsageRings } from './parts/UsageRings'

/**
 * Строка под полем ввода: слева модель, усилие и режим разговора одним индикатором, справа
 * кольца лимитов в ряд и токены за день, как в ACC. Контекст - не здесь, а в ряду кнопок
 * поля. Узкая панель - индикатор режет подпись, показания стоят целиком.
 */
export const ComposerStatus = ({ conversation }: ComposerStatusProps) => (
  <div className={styles.composerStatus}>
    <SetupPicker conversation={conversation} />
    <div className={styles.meters}>
      <UsageRings />
      <TodayTokens />
    </div>
  </div>
)
