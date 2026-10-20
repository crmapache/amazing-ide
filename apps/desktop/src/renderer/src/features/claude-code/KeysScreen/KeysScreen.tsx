import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import { Kbd } from '@amazing-ide/ui/Kbd'

import { usePanelPrefs } from '../claude.queries'
import { PanelScreen } from '../PanelScreen/PanelScreen'
import styles from './KeysScreen.module.scss'
import { keyGroups } from './KeysScreen.utils'

/**
 * Settings → Keyboard shortcuts: все клавиши панели на одном экране, плашками, по
 * разделам ACC. Клавиша, о которой никто не знает, - тот же клик мышью. Переназначения
 * здесь нет: клавиши панели фиксированы, как в терминале.
 */
export const KeysScreen = () => {
  const { t } = useTranslation()
  const { sendKey } = usePanelPrefs()

  return (
    <PanelScreen title={t('claudeCode.menu.titles.keys.title')}>
      <p className={styles.note}>{t('claudeCode.keys.note')}</p>
      {keyGroups(sendKey).map((group) => (
        <section
          key={group.id}
          className={styles.group}
          aria-label={t(`claudeCode.keys.groups.${group.id}`)}>
          <h3 className={styles.groupTitle}>{t(`claudeCode.keys.groups.${group.id}`)}</h3>
          {group.rows.map((row) => (
            <div key={row.id} className={styles.row}>
              <span className={styles.text}>
                <span className={styles.label}>{t(`claudeCode.keys.rows.${row.id}.label`)}</span>
                {row.when && (
                  <span className={styles.when}>{t(`claudeCode.keys.rows.${row.when}.when`)}</span>
                )}
              </span>
              <span className={styles.caps}>
                {row.chords.map((chord, index) => (
                  <Fragment key={chord.join('')}>
                    {index > 0 && <span className={styles.between}>{t('claudeCode.keys.or')}</span>}
                    <Kbd keys={chord} />
                  </Fragment>
                ))}
              </span>
            </div>
          ))}
        </section>
      ))}
    </PanelScreen>
  )
}
