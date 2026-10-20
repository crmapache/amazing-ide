import { memo, useMemo, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSmoothText, RevealProvider } from 'smooth-stream-text/react'

import { IconButton } from '@amazing-ide/ui/IconButton'

import { useCopy } from '../clipboard.hooks'
import { useFeedScope } from '../feed-scope.context'
import { RevealContext } from '../reveal.context'
import { FindingsCard } from '../FindingsCard/FindingsCard'
import { readReview } from '../FindingsCard/FindingsCard.utils'
import { Markdown } from '../Markdown/Markdown'
import { PinButton } from '../PinButton/PinButton'
import { REVEAL_LIMIT } from './AssistantMessage.constants'
import { useRevealOptions } from './AssistantMessage.hooks'
import styles from './AssistantMessage.module.scss'
import type { AssistantMessageProps } from './AssistantMessage.types'
import { replyClipboard } from './AssistantMessage.utils'

/**
 * Ответ модели - карточка с рамкой (как в ACC): видно, где кончились шаги и начался
 * ответ. В углу всегда булавка и копия всего ответа. CLI шлёт текст рывками -
 * smooth-stream-text выравнивает темп, а символы проступают волной; готовый ответ
 * (история, транскрипт) и очень длинный встают сразу.
 */
export const AssistantMessage = memo(({ item }: AssistantMessageProps) => {
  const { t } = useTranslation()
  const { conversationId } = useFeedScope()
  const { isCopied, copy } = useCopy()
  // Волна - только у ответа, который печатается на глазах: готовому из истории нечего проявлять.
  const [isLive] = useState(item.streaming)
  const { text } = useSmoothText(item.text, { done: !item.streaming })
  const reveal = useRevealOptions()
  const isRevealed = isLive && item.text.length <= REVEAL_LIMIT
  // Итог /code-review - вступление текстом, находки карточкой REVIEW (как в ACC).
  const review = useMemo(
    () => (item.streaming ? null : readReview(item.text)),
    [item.streaming, item.text],
  )

  const handleCopy = () => copy(replyClipboard(item.text))

  return (
    <div className={styles.assistantMessage}>
      <div className={styles.actions}>
        <PinButton conversationId={conversationId} itemId={item.id} />
        <IconButton
          icon={isCopied ? Check : Copy}
          size="sm"
          label={isCopied ? t('claudeCode.message.copied') : t('claudeCode.message.copyReply')}
          onClick={handleCopy}
        />
      </div>
      {review ? (
        <>
          {review.intro && <Markdown text={review.intro} />}
          <FindingsCard findings={review.findings} />
        </>
      ) : (
        <RevealContext value={isRevealed}>
          {isRevealed ? (
            // Одна волна на весь ответ: иначе каждый абзац начинал бы её заново.
            <RevealProvider resetKey={item.id} {...reveal}>
              <Markdown text={text} />
            </RevealProvider>
          ) : (
            <Markdown text={text} />
          )}
        </RevealContext>
      )}
    </div>
  )
})

AssistantMessage.displayName = 'AssistantMessage'
