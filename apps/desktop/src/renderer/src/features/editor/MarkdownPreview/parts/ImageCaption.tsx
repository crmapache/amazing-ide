import { useProblemText } from '../MarkdownPreview.hooks'
import styles from '../MarkdownPreview.module.scss'
import type { ImageCaptionProps } from '../MarkdownPreview.types'

/**
 * Подпись на месте картинки, которой нет: её alt (или адрес) и почему - нет файла,
 * не картинка, велика, нельзя прочесть. Картинка с сайта, которую ещё не разрешили, -
 * без причины: о ней говорит полоса над просмотром.
 */
export const ImageCaption = ({ image, problem }: ImageCaptionProps) => {
  const reason = useProblemText(problem)

  return (
    <span className={styles.missingImage}>
      {image.alt || image.src}
      {reason && <span className={styles.missingReason}>{reason}</span>}
    </span>
  )
}
