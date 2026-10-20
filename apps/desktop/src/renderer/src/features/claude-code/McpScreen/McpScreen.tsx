import { useState } from 'react'
import { RotateCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { McpServer } from '@shared/claude-tools'

import { Button } from '@amazing-ide/ui/Button'
import { Dialog } from '@amazing-ide/ui/Dialog'
import { IconButton } from '@amazing-ide/ui/IconButton'

import type { MenuScreenProps } from '../claude.types'
import { PanelScreen } from '../PanelScreen/PanelScreen'
import { ScreenFailure } from '../ScreenFailure/ScreenFailure'
import { SCOPE_KEYS } from './McpScreen.constants'
import { useMcpScreen } from './McpScreen.hooks'
import styles from './McpScreen.module.scss'
import type { McpServersProps } from './McpScreen.types'
import { groupServers } from './McpScreen.utils'
import { McpAddForm } from './parts/McpAddForm'
import { McpServerRow } from './parts/McpServerRow'

/**
 * MCP-серверы проекта, как их видит процесс разговора: группами по месту настройки, с
 * состоянием и ошибкой. Вход в сервер открывает браузер, список потом обновится сам.
 * Добавленный или удалённый сервер разговоры подхватят после перезапуска процесса -
 * панель делает его сама, как только ход кончится.
 */
export const McpScreen = ({ conversation, project }: MenuScreenProps) =>
  conversation && <McpServers conversation={conversation} project={project} />

const McpServers = ({ conversation, project }: McpServersProps) => {
  const { t } = useTranslation()
  const screen = useMcpScreen(conversation)
  const [removing, setRemoving] = useState<McpServer | null>(null)
  const { data, isPending } = screen.listing
  const groups = groupServers(data?.servers ?? [])

  const handleRemove = () => {
    if (removing) screen.remove(removing)

    setRemoving(null)
  }

  return (
    <PanelScreen
      title={t('claudeCode.menu.titles.mcp.title')}
      notice={screen.notice}
      actions={
        <IconButton icon={RotateCw} label={t('claudeCode.mcp.refresh')} onClick={screen.refresh} />
      }>
      {isPending && <div className={styles.empty}>{t('claudeCode.mcp.loading')}</div>}
      {data?.failure && (
        <ScreenFailure
          failure={data.failure}
          detail={data.detail}
          projectId={project.id}
          onTrusted={screen.refresh}
        />
      )}
      {!isPending && !data?.failure && groups.length === 0 && (
        <div className={styles.empty}>{t('claudeCode.mcp.none')}</div>
      )}
      {groups.map((group) => (
        <section key={group.scope} className={styles.group}>
          <div className={styles.groupTitle}>{t(SCOPE_KEYS[group.scope])}</div>
          <ul className={styles.servers}>
            {group.servers.map((server) => (
              <McpServerRow
                key={server.name}
                server={server}
                busy={screen.busy === server.name}
                onAction={screen.act}
                onRemove={setRemoving}
              />
            ))}
          </ul>
        </section>
      ))}
      <McpAddForm busy={screen.busy === 'add'} onAdd={screen.add} />
      <Dialog
        open={removing !== null}
        title={t('claudeCode.mcp.removeTitle', { name: removing?.name ?? '' })}
        onSubmit={handleRemove}
        onClose={() => setRemoving(null)}
        actions={
          <>
            <Button type="button" onClick={() => setRemoving(null)}>
              {t('claudeCode.mcp.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('claudeCode.mcp.remove')}
            </Button>
          </>
        }>
        {t('claudeCode.mcp.removeText')}
      </Dialog>
    </PanelScreen>
  )
}
