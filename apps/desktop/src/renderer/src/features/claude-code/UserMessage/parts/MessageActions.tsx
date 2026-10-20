import { useMemo } from 'react'
import { Copy, Check, Undo2, History } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconButton } from '@amazing-ide/ui/IconButton'

import styles from '../UserMessage.module.scss'
import type { MessageActionsProps } from '../UserMessage.types'
import { useClaudeCodeStore } from '../../claude-code.store'
import { useCopy } from '../../clipboard.hooks'
import { useFeedScope } from '../../feed-scope.context'
import { applyDraft } from '../../field-bus'
import { useReuseDraft } from '../../message.hooks'
import { lostImages, messageClipboard } from '../../message.utils'
import { PinButton } from '../../PinButton/PinButton'

/**
 * Кнопки своего сообщения - всегда видны, бледные, в порядке ACC: закрепить, копировать
 * (с путями вложений), вернуть в поле, откатить. Откат последний: он забирает. Что
 * картинка не вернётся в поле, подсказка говорит до нажатия; написанное посреди хода
 * откатить нельзя - кнопка мертва и говорит, к чему откатываться.
 */
export const MessageActions = ({ item, draft }: MessageActionsProps) => {
  const { t } = useTranslation()
  const { conversationId } = useFeedScope()
  const { isCopied, copy } = useCopy()
  const openRewind = useClaudeCodeStore((store) => store.openRewind)
  const reuseDraft = useReuseDraft()
  const lost = useMemo(() => lostImages(draft, item.images.length), [draft, item.images.length])

  const handleCopy = () => copy(messageClipboard(draft))

  const handleReuse = () => {
    void reuseDraft(conversationId, item, draft).then((reused) =>
      applyDraft(conversationId, reused),
    )
  }

  const handleRewind = () => openRewind({ conversationId, messageId: item.id })

  return (
    <div className={styles.actions}>
      <PinButton conversationId={conversationId} itemId={item.id} />
      <IconButton
        icon={isCopied ? Check : Copy}
        size="sm"
        label={isCopied ? t('claudeCode.message.copied') : t('claudeCode.message.copy')}
        onClick={handleCopy}
      />
      <IconButton
        icon={Undo2}
        size="sm"
        label={
          lost > 0
            ? t('claudeCode.message.reuseLostImages', { count: lost })
            : t('claudeCode.message.reuse')
        }
        onClick={handleReuse}
      />
      <IconButton
        icon={History}
        size="sm"
        label={
          item.steering ? t('claudeCode.message.rewindSteering') : t('claudeCode.message.rewind')
        }
        aria-disabled={item.steering || undefined}
        onClick={handleRewind}
      />
    </div>
  )
}
