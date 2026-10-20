import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@amazing-ide/ui/EmptyState'
import { Kbd } from '@amazing-ide/ui/Kbd'
import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'

import { useClaudeCodeStore } from '../claude-code.store'
import { SUGGESTIONS } from './Welcome.constants'
import styles from './Welcome.module.scss'
import type { WelcomeProps } from './Welcome.types'

/**
 * Пустой разговор, как пустая лента ACC: «Ask Claude about this project» и «@ for files ·
 * / for commands»; ниже (своё IDE) - идеи для начала и клавиши поля. Идея подставляется
 * в поле, а не отправляется сразу - её обычно дописывают.
 */
export const Welcome = ({ draftKey }: WelcomeProps) => {
  const { t } = useTranslation()
  const fillDraft = useClaudeCodeStore((store) => store.fillDraft)

  const handlePick = (text: string) => () => fillDraft(draftKey, text)

  return (
    <div className={styles.welcome}>
      <EmptyState
        icon={Sparkles}
        title={t('claudeCode.welcome.title')}
        description={t('claudeCode.welcome.text')}
        action={
          <div className={styles.extras}>
            <div className={styles.ideas}>
              <div className={styles.caption}>{t('claudeCode.welcome.suggestionsLabel')}</div>
              <Menu label={t('claudeCode.welcome.suggestionsLabel')}>
                {SUGGESTIONS.map(({ icon, textKey }) => (
                  <MenuItem
                    key={textKey}
                    icon={icon}
                    label={t(textKey)}
                    onSelect={handlePick(t(textKey))}
                  />
                ))}
              </Menu>
            </div>
            <div className={styles.keys}>
              <span className={styles.key}>
                <Kbd keys={['⏎']} />
                {t('claudeCode.welcome.send')}
              </span>
              <span className={styles.key}>
                <Kbd keys={['⇧', '⏎']} />
                {t('claudeCode.welcome.newLine')}
              </span>
              <span className={styles.key}>
                <Kbd keys={['/']} />
                {t('claudeCode.welcome.commands')}
              </span>
            </div>
          </div>
        }
      />
    </div>
  )
}
