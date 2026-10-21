import { useMemo } from 'react'

import { htmlToElements } from '../markdown-dom.utils'
import { markdownToHtml } from '../markdown-html.utils'
import { webImageUrls } from '../markdown-links.utils'
import { useDocumentText, usePreviewRenderers } from './MarkdownPreview.hooks'
import styles from './MarkdownPreview.module.scss'
import type { MarkdownPreviewProps } from './MarkdownPreview.types'
import { WebImagesNotice } from './parts/WebImagesNotice'

/**
 * Просмотр файла Markdown, как на GitHub: GFM, HTML из файла по списку GitHub, блоки кода
 * с подсветкой, картинки проекта (и с сайтов - по разрешению), ссылки на файлы и
 * заголовки. Текст - из модели редактора, перерисовка - вслед за набором. Прокрутку с
 * кодом сводит редактор (markdown-scroll.hooks.ts) - по меткам строк в листе.
 */
export const MarkdownPreview = ({ projectId, path, ref }: MarkdownPreviewProps) => {
  const text = useDocumentText(projectId, path)
  const renderers = usePreviewRenderers(projectId, path)
  const preview = useMemo(() => htmlToElements(markdownToHtml(text), renderers), [text, renderers])
  const webImages = useMemo(() => webImageUrls(preview.images, path), [preview.images, path])

  return (
    <div className={styles.markdownPreview}>
      <WebImagesNotice projectId={projectId} path={path} urls={webImages} />
      <div ref={ref} className={styles.scroll} data-preview-scroll>
        <article className={styles.preview}>{preview.content}</article>
      </div>
    </div>
  )
}
