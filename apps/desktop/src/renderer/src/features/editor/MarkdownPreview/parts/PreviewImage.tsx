import type { PreviewImageProps } from '../MarkdownPreview.types'
import { imageSource } from '../../markdown-links.utils'
import { ImageCaption } from './ImageCaption'
import { ProjectImage } from './ProjectImage'
import { ShownImage } from './ShownImage'
import { WebImage } from './WebImage'

/**
 * Картинка просмотра: файл проекта (читает главный процесс), с сайта по https (только
 * по разрешению человека), вписанная data URL. Иначе - подпись вместо неё.
 */
export const PreviewImage = ({ projectId, filePath, image }: PreviewImageProps) => {
  const source = imageSource(image.src, filePath)

  switch (source.kind) {
    case 'project':
      return <ProjectImage projectId={projectId} path={source.path} image={image} />
    case 'web':
      return <WebImage projectId={projectId} filePath={filePath} url={source.url} image={image} />
    case 'inline':
      return <ShownImage src={source.url} image={image} />
    case 'none':
      return <ImageCaption image={image} problem={{ kind: 'missing' }} />
  }
}
