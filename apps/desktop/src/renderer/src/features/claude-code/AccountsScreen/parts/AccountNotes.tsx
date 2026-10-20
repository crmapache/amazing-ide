import { Palette } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { ClaudeState } from '@shared/claude'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@amazing-ide/ui/Button'

import styles from '../AccountsScreen.module.scss'
import type { AccountNotesProps } from '../AccountsScreen.types'
import { invoke } from '../../../../lib/ipc'
import { QUERY_KEYS } from '../../../../state/query-keys'

/**
 * Пояснения под списком аккаунтов (как в ACC): что делает «Add» (Терминал, имеющийся
 * аккаунт не трогается), что MCP-входы у каждого аккаунта свои, и вход в Claude Design -
 * тоже по аккаунту и только в Терминале; кнопка верна и для машины с одним входом.
 */
export const AccountNotes = ({ busy }: AccountNotesProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const handleDesign = () => {
    invoke('claudePanel:terminalCommand', { command: 'design-login' })
      .then((state) => queryClient.setQueryData<ClaudeState>(QUERY_KEYS.claudeState, state))
      .catch((error: unknown) => console.warn('[claude-code] вход в Design не открылся:', error))
  }

  return (
    <>
      <p className={styles.note}>{t('claudeCode.accounts.addHint')}</p>
      <p className={styles.note}>{t('claudeCode.accounts.mcpNote')}</p>
      <section className={styles.section}>
        <span className={styles.sectionTitle}>{t('claudeCode.accounts.designTitle')}</span>
        <p className={styles.note}>{t('claudeCode.accounts.designNote')}</p>
        <div className={styles.footer}>
          <Button icon={Palette} disabled={busy} onClick={handleDesign}>
            {t('claudeCode.accounts.designAuthorize')}
          </Button>
        </div>
      </section>
    </>
  )
}
