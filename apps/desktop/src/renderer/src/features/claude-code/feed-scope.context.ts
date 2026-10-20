import { use, createContext } from 'react'

import type { PendingRequest } from '@shared/claude'

/** Чья это лента: разговор (для действий) и папка проекта (пути от корня, открытие файлов). */
type FeedScope = {
  conversationId: string
  projectPath: string
}

/**
 * Лента кладёт сюда свой разговор, строки берут его отсюда, а не пропсом через каждую
 * обёртку: так строка перерисовывается по своим данным, а не по смене пропсов.
 */
export const FeedScopeContext = createContext<FeedScope>({ conversationId: '', projectPath: '' })

export const useFeedScope = () => use(FeedScopeContext)

/**
 * Вопрос, на котором стоит ход (разрешение, план); null - никто не ждёт. Отдельно от
 * FeedScope: меняется на каждом вопросе, и перерисовывать из-за этого все строки
 * незачем - только карточки вызовов и плана.
 */
export const PendingContext = createContext<PendingRequest | null>(null)

export const usePendingRequest = () => use(PendingContext)

/** Вызов, который ждёт разрешения человека, - его id; null - никто. */
export const useAwaitingTool = (): string | null => {
  const pending = use(PendingContext)

  return pending?.kind === 'permission' ? pending.toolUseId : null
}
