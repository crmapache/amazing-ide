import { useTranslation } from 'react-i18next'

import { Badge } from '@amazing-ide/ui/Badge'
import { Button } from '@amazing-ide/ui/Button'

import { STATUS_VIEW } from '../McpScreen.constants'
import type { McpServerRowProps } from '../McpScreen.types'
import { SettingsItem } from '../../SettingsItem/SettingsItem'

/**
 * Сервер: имя, состояние словами CLI и сколько у него инструментов, команда или адрес,
 * ошибка. Кнопки - по делу: войти, когда ждёт входа; переподключить (у упавшего -
 * «ещё раз»); выключить или включить; удалить своё.
 */
export const McpServerRow = ({ server, busy, onAction, onRemove }: McpServerRowProps) => {
  const { t } = useTranslation()
  const view = STATUS_VIEW[server.status]
  const isDisabled = server.status === 'disabled'

  return (
    <SettingsItem
      title={server.name}
      badges={<Badge tone={view.tone}>{t(view.key)}</Badge>}
      meta={
        server.toolCount > 0 ? t('claudeCode.mcp.tools', { count: server.toolCount }) : undefined
      }
      details={[server.target]}
      code
      error={server.error}
      actions={
        <>
          {server.status === 'needs-auth' && (
            <Button
              size="sm"
              variant="primary"
              disabled={busy}
              onClick={() => onAction(server, 'authenticate')}>
              {t('claudeCode.mcp.authenticate')}
            </Button>
          )}
          {!isDisabled && (
            <Button size="sm" disabled={busy} onClick={() => onAction(server, 'reconnect')}>
              {server.status === 'failed'
                ? t('claudeCode.mcp.retry')
                : t('claudeCode.mcp.reconnect')}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => onAction(server, isDisabled ? 'enable' : 'disable')}>
            {isDisabled ? t('claudeCode.mcp.enable') : t('claudeCode.mcp.disable')}
          </Button>
          {server.removable && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onRemove(server)}>
              {t('claudeCode.mcp.remove')}
            </Button>
          )}
        </>
      }
    />
  )
}
