import styles from '../MarkdownPreview.module.scss'
import type { WebImageProps } from '../MarkdownPreview.types'
import { useWebImage } from '../../markdown-preview.queries'
import { useAllowedWebImages } from '../../web-images.store'
import { ImageCaption } from './ImageCaption'
import { ShownImage } from './ShownImage'

/**
 * Картинка с сайта: пока человек не разрешил - подпись (полоса над просмотром
 * спрашивает), разрешил - грузит главный процесс, окно получает data URL.
 */
export const WebImage = ({ projectId, filePath, url, image }: WebImageProps) => {
  const isAllowed = useAllowedWebImages(projectId, filePath).includes(url)
  const { data } = useWebImage(url, isAllowed)

  if (!isAllowed) return <ImageCaption image={image} problem={{ kind: 'hidden' }} />
  if (!data) return <span className={styles.imagePending} aria-hidden />
  if (data.kind !== 'image') return <ImageCaption image={image} problem={data} />

  return <ShownImage src={data.data} image={image} />
}
