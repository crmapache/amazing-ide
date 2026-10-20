import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@amazing-ide/ui/Button'

import { COLLAPSE_AFTER, COLLAPSED_COUNT } from './ChangesList.constants'
import { useChangesList } from './ChangesList.hooks'
import styles from './ChangesList.module.scss'
import type { ChangesListProps } from './ChangesList.types'
import { ChangeRow } from './parts/ChangeRow'

/**
 * Файлы, которые поменял ход, - под ответом, перед итогом. Список из самих правок, а не
 * из того, что модель решила написать. Пока после хода ничего не написано, файлы с
 * точным диффом откатываются по одному и все разом и возвращаются той же кнопкой;
 * подвал - «Show all» слева, «Bring all back» и «Revert all» справа, обе могут стоять.
 */
export const ChangesList = ({ turn }: ChangesListProps) => {
  const { t } = useTranslation()
  const list = useChangesList(turn)
  const [isUnfolded, setIsUnfolded] = useState(false)
  const { changes, revertable } = turn
  const isFoldable = changes.length > COLLAPSE_AFTER
  const shown = isFoldable && !isUnfolded ? changes.slice(0, COLLAPSED_COUNT) : changes
  const hasButtons = revertable && changes.some((change) => change.undoable)
  // Подвал стоит всегда, когда действовать есть над чем больше чем одним файлом: подвал,
  // который появляется и пропадает, двигал бы весь список на свою высоту.
  const hasFooter =
    isFoldable || (revertable && changes.filter((change) => change.undoable).length > 1)

  return (
    <div className={styles.changesList}>
      <ul aria-label={t('claudeCode.changes.label')} className={styles.rows}>
        {shown.map((change) => (
          <ChangeRow
            key={change.path}
            change={change}
            slot={hasButtons}
            actionable={revertable && change.undoable}
            press={list.presses.get(change.path)}
            onToggle={list.toggle}
          />
        ))}
      </ul>
      {hasFooter && (
        <div className={styles.footer}>
          {isFoldable && (
            <Button variant="ghost" size="sm" onClick={() => setIsUnfolded(!isUnfolded)}>
              {isUnfolded
                ? t('claudeCode.changes.showFewer')
                : t('claudeCode.changes.showAll', { count: changes.length })}
            </Button>
          )}
          <span className={styles.spacer} />
          {revertable && list.restoreCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={!list.canRestoreAll}
              onClick={list.restoreAll}>
              {t('claudeCode.changes.restoreAll')}
            </Button>
          )}
          {revertable && list.revertCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={!list.canRevertAll}
              onClick={list.revertAll}>
              {t('claudeCode.changes.revertAll')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
