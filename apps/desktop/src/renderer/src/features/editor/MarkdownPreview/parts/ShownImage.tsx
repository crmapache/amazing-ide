import { useState } from 'react'

import styles from '../MarkdownPreview.module.scss'
import type { ShownImageProps } from '../MarkdownPreview.types'
import { ImageCaption } from './ImageCaption'

/**
 * Картинка, у которой уже есть данные (data URL). Не разжалась - подпись; помнится
 * именно этот адрес: соседняя картинка, вставшая на её место после правки, не битая.
 */
export const ShownImage = ({ src, image }: ShownImageProps) => {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null)

  const handleError = () => setBrokenSrc(src)

  if (brokenSrc === src) return <ImageCaption image={image} problem={{ kind: 'notImage' }} />

  return (
    <img
      className={styles.image}
      src={src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      data-align={image.align}
      onError={handleError}
    />
  )
}
