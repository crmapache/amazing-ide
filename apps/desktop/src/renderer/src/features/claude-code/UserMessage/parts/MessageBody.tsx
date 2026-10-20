import { useMemo } from 'react'

import styles from '../UserMessage.module.scss'
import type { MessageBodyProps } from '../UserMessage.types'
import { messagePictures } from '../UserMessage.utils'
import { useFeedScope } from '../../feed-scope.context'
import { pastedOrdinals } from '../../message.utils'
import { LinkedText } from '../../LinkedText/LinkedText'
import { PastedText } from './PastedText'
import { SentChip } from './SentChip'

/**
 * Слова и вложения сообщения ровно как написаны: без разметки и своих переносов, адреса
 * и пути - живыми ссылками, вложения - чипами на своих местах в тексте. Вставленная
 * картинка открывается картинкой сообщения, выбранная - своим файлом.
 */
export const MessageBody = ({
  tokens,
  messageId,
  onOpenImage,
  onOpenPicture,
}: MessageBodyProps) => {
  const { conversationId } = useFeedScope()
  // Номер картинки среди вставленных и что за каждым чипом - раз на сообщение, а не на чип.
  const ordinals = useMemo(() => pastedOrdinals(tokens), [tokens])
  const pictures = useMemo(
    () => messagePictures(tokens, ordinals, conversationId, messageId),
    [tokens, ordinals, conversationId, messageId],
  )

  if (tokens.length === 0) return null

  return (
    <div className={styles.body}>
      {tokens.map((token, index) => {
        if (token.kind === 'text') return <LinkedText key={index} text={token.value} />

        if (token.chip.kind === 'paste') {
          return <PastedText key={index} chip={token.chip} isBlock={index === tokens.length - 1} />
        }

        const image = ordinals[index] ?? -1
        const picture = pictures[index] ?? null
        const openImage = () => onOpenImage(image)
        const openPicture = picture ? () => onOpenPicture(picture, token.chip) : undefined

        return (
          <SentChip
            key={index}
            chip={token.chip}
            picture={picture}
            onOpen={image >= 0 ? openImage : openPicture}
          />
        )
      })}
    </div>
  )
}
