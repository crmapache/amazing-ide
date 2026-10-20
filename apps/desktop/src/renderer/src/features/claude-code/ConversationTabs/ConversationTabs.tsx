import { useState } from 'react'
import { Plus, GitFork, Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { ClaudeState } from '@shared/claude'

import { IconButton } from '@amazing-ide/ui/IconButton'

import { useClaudeActions } from '../claude-actions.hooks'
import { useClaudeCodeStore } from '../claude-code.store'
import { keyLine } from '../panel-keys.utils'
import { useResting, useAnswerOnOpen } from '../tab-calls.hooks'
import { CALLS_REST_AFTER_MS } from './ConversationTabs.constants'
import { useTabDrag } from './ConversationTabs.hooks'
import styles from './ConversationTabs.module.scss'
import type { ConversationTabsProps } from './ConversationTabs.types'
import { ConversationTab } from './parts/ConversationTab'
import { TabContextMenu } from './parts/TabContextMenu'

/**
 * Шапка панели, как в ACC: полоса вкладок разговоров в несколько рядов (группа - разговор
 * и его форки - подряд и одним цветом), справа три кнопки IDE - новый разговор, форк
 * выбранного, меню. Отдельной кнопки истории нет: прошлые разговоры - строка меню и
 * /resume. Ветка и PR - в шапке окна, а не здесь: ветка там уже есть, второй раз она не
 * нужна. Вкладки переставляются рукой, порядок хранит главный процесс.
 */
export const ConversationTabs = ({ project, conversations, activeId }: ConversationTabsProps) => {
  const { t } = useTranslation()
  const { newConversation, fork, moveGroup, moveTab } = useClaudeActions()
  const calls = useClaudeCodeStore((store) => store.calls)
  const openMenu = useClaudeCodeStore((store) => store.openMenu)
  // Ответ перестановки - id вкладок проекта в новом порядке: группа несётся целиком, форк -
  // внутри своей группы.
  const idsOf = (state: ClaudeState | null) =>
    state?.conversations
      .filter((conversation) => conversation.projectPath === project.rootPath)
      .map((conversation) => conversation.id) ?? null
  const { stripRef, register, view, onPress, wasDragged } = useTabDrag(conversations, {
    moveGroup: (groupId, before) => moveGroup(groupId, before).then(idsOf),
    moveTab: (id, before) => moveTab(id, before).then(idsOf),
  })
  const [menu, setMenu] = useState<{ id: string; anchor: HTMLElement } | null>(null)
  const lit = conversations.flatMap((conversation) => calls[conversation.id] ?? [])
  const calm = useResting(
    CALLS_REST_AFTER_MS,
    Math.max(0, ...lit.map((call) => call.at)),
    lit.length > 0,
  )

  useAnswerOnOpen(activeId)

  const active = conversations.find((conversation) => conversation.id === activeId)
  const canFork = Boolean(active && (active.title || active.fork))
  const groupSizes = new Map<string, number>()

  for (const { groupId } of conversations)
    groupSizes.set(groupId, (groupSizes.get(groupId) ?? 0) + 1)

  const handleNew = () => void newConversation(project.id)

  const handleFork = () => {
    if (active) void fork(active.id, null)
  }

  // Корень бокового меню: прошлые разговоры, MCP, плагины, аккаунты, настройки.
  const handleOpenMenu = () => openMenu()

  const handleMenu = (id: string, anchor: HTMLElement) => setMenu({ id, anchor })

  const handleMenuClosed = () => setMenu(null)

  return (
    <div className={styles.conversationTabs} data-tab-strip>
      {conversations.length > 0 ? (
        <div
          ref={stripRef}
          role="tablist"
          aria-label={t('claudeCode.tabsLabel')}
          className={styles.tabList}
          // eslint-disable-next-line no-restricted-syntax -- полоса подрастает на ряд, который добавит отпускание
          style={view.reach ? { minHeight: view.reach } : undefined}>
          {conversations.map((conversation, index) => (
            <ConversationTab
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeId}
              startsGroup={conversations[index - 1]?.groupId !== conversation.groupId}
              groupSize={groupSizes.get(conversation.groupId) ?? 1}
              call={calls[conversation.id]?.tone ?? null}
              calm={calm}
              dragView={view}
              register={register}
              onPress={onPress}
              onMenu={handleMenu}
              wasDragged={wasDragged}
            />
          ))}
        </div>
      ) : (
        <div className={styles.heading}>{t('claudeCode.title')}</div>
      )}
      <div className={styles.actions}>
        <IconButton
          icon={Plus}
          label={t('claudeCode.tabs.newChat', { key: keyLine('newTab') })}
          onClick={handleNew}
        />
        <IconButton
          icon={GitFork}
          label={canFork ? t('claudeCode.forkChat') : t('claudeCode.forkNothing')}
          disabled={!canFork}
          onClick={handleFork}
        />
        <IconButton icon={Settings2} label={t('claudeCode.menu.open')} onClick={handleOpenMenu} />
      </div>
      <TabContextMenu
        conversation={conversations.find((conversation) => conversation.id === menu?.id) ?? null}
        anchor={menu?.anchor ?? null}
        onClose={handleMenuClosed}
      />
    </div>
  )
}
