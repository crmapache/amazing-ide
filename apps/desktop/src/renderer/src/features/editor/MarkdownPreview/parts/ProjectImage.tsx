import styles from '../MarkdownPreview.module.scss'
import type { ProjectImageProps } from '../MarkdownPreview.types'
import { usePreviewImage } from '../../markdown-preview.queries'
import { ImageCaption } from './ImageCaption'
import { ShownImage } from './ShownImage'

/** Картинка из файла проекта: data URL от главного процесса; нет её - подпись с причиной. */
export const ProjectImage = ({ projectId, path, image }: ProjectImageProps) => {
  const { data } = usePreviewImage(projectId, path)

  if (!data) return <span className={styles.imagePending} aria-hidden />
  if (data.kind !== 'image') return <ImageCaption image={image} problem={data} />

  return <ShownImage src={data.data} image={image} />
}
