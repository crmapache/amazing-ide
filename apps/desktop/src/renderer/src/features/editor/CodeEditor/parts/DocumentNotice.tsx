import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@amazing-ide/ui/Button'

import styles from '../CodeEditor.module.scss'
import type { DocumentNoticeProps } from '../CodeEditor.types'
import { documents } from '../../documents'
import { useSelectionStore } from '../../../../state/selection.store'

/**
 * Полоса над кодом, когда файл нельзя молча сохранить, - как уведомление редактора в
 * WebStorm. Конфликт: взять с диска или оставить своё. Удалён: записать снова или
 * закрыть. Не записался: ещё раз. Файл за проектом: сохранить по просьбе. До ответа
 * автосохранение ждёт.
 */
export const DocumentNotice = ({ projectId, path, notice }: DocumentNoticeProps) => {
  const { t } = useTranslation()
  const closeTabs = useSelectionStore((state) => state.closeTabs)
  const message =
    notice.kind === 'saveFailed'
      ? t(`editor.notice.saveFailed.${notice.reason}`)
      : t(`editor.notice.${notice.kind}`)

  const handleTakeDisk = () => void documents.find(projectId, path)?.takeDisk()

  const handleKeepMine = () => void documents.find(projectId, path)?.keepMine()

  const handleSave = () => void documents.find(projectId, path)?.saveAsked()

  const handleClose = () => {
    documents.discard(projectId, [path])
    closeTabs(projectId, [path])
  }

  return (
    <div className={styles.notice} role="alert">
      <TriangleAlert className={styles.noticeIcon} aria-hidden />
      <span className={styles.noticeText}>{message}</span>
      {notice.kind === 'conflict' && (
        <>
          <Button size="sm" variant="secondary" onClick={handleTakeDisk}>
            {t('editor.notice.takeDisk')}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleKeepMine}>
            {t('editor.notice.keepMine')}
          </Button>
        </>
      )}
      {notice.kind === 'deleted' && (
        <>
          <Button size="sm" variant="secondary" onClick={handleKeepMine}>
            {t('editor.notice.saveAgain')}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClose}>
            {t('editor.notice.close')}
          </Button>
        </>
      )}
      {notice.kind === 'saveFailed' && (
        <Button size="sm" variant="secondary" onClick={handleSave}>
          {t('editor.notice.retry')}
        </Button>
      )}
      {notice.kind === 'outside' && (
        <Button size="sm" variant="secondary" onClick={handleSave}>
          {t('editor.notice.save')}
        </Button>
      )}
    </div>
  )
}
