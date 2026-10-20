import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import type { McpAddScope, McpTransport } from '@shared/claude-tools'
import { MCP_ADD_SCOPES, MCP_TRANSPORTS } from '@shared/claude-tools'

import { Button } from '@amazing-ide/ui/Button'
import { Card } from '@amazing-ide/ui/Card'
import { Tabs } from '@amazing-ide/ui/Tabs'
import { TextField } from '@amazing-ide/ui/TextField'

import styles from '../McpScreen.module.scss'
import type { McpAddFormProps } from '../McpScreen.types'

/**
 * Новый сервер: имя, как подключать (команда или адрес) и куда записать - в проект
 * (.mcp.json, для всей команды), только себе в этом проекте или себе везде.
 */
export const McpAddForm = ({ busy, onAdd }: McpAddFormProps) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [transport, setTransport] = useState<McpTransport>('stdio')
  const [scope, setScope] = useState<McpAddScope>('local')
  const canAdd = Boolean(name.trim() && target.trim()) && !busy

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (canAdd) onAdd({ name: name.trim(), transport, target: target.trim(), scope })
  }

  return (
    <Card title={t('claudeCode.mcp.addTitle')} description={t('claudeCode.mcp.addHint')}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <TextField
          label={t('claudeCode.mcp.name')}
          value={name}
          placeholder={t('claudeCode.mcp.namePlaceholder')}
          onChange={setName}
        />
        <Tabs
          label={t('claudeCode.mcp.transport')}
          items={MCP_TRANSPORTS.map((id) => ({ id, label: t(`claudeCode.mcp.transports.${id}`) }))}
          value={transport}
          onChange={setTransport}
        />
        <TextField
          label={transport === 'stdio' ? t('claudeCode.mcp.command') : t('claudeCode.mcp.url')}
          value={target}
          placeholder={
            transport === 'stdio'
              ? t('claudeCode.mcp.commandPlaceholder')
              : t('claudeCode.mcp.urlPlaceholder')
          }
          onChange={setTarget}
        />
        <Tabs
          label={t('claudeCode.mcp.scope')}
          items={MCP_ADD_SCOPES.map((id) => ({ id, label: t(`claudeCode.mcp.addScopes.${id}`) }))}
          value={scope}
          onChange={setScope}
        />
        <div className={styles.formActions}>
          <Button type="submit" variant="primary" size="sm" disabled={!canAdd}>
            {t('claudeCode.mcp.add')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
