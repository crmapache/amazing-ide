import { useState } from 'react'
import type { MouseEvent } from 'react'

import styles from '../MarkdownPreview.module.scss'
import type { PreviewLinkProps } from '../MarkdownPreview.types'
import { linkTarget, isPreviewImagePath } from '../../markdown-links.utils'
import { anchorTop } from '../../markdown-scroll.utils'
import { useOpenFileAction } from '../../../../state/open-file.context'
import { ImageLightbox } from './ImageLightbox'

/**
 * Ссылка просмотра. Сайт - в браузер человека (окно отдаёт _blank главному процессу);
 * «#раздел» - прокрутка к заголовку; путь - общим действием «открыть файл», как из
 * ленты: файл во вкладке (`#L10` - на строку) и в дереве, папка - в дереве, картинка -
 * крупно поверх окна. Путь точный: ссылки, которой нет, нет и у нас - одноимённый файл
 * из другой папки не откроется. Остальное (mailto, file, javascript) - текст. Страница
 * окна по ссылке не уходит никогда.
 */
export const PreviewLink = ({ projectId, filePath, href, children }: PreviewLinkProps) => {
  const openFile = useOpenFileAction()
  const [zoomed, setZoomed] = useState<string | null>(null)
  const target = linkTarget(href, filePath)

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()

    if (target.kind === 'file' && isPreviewImagePath(target.path)) return setZoomed(target.path)
    if (target.kind === 'file') {
      return void openFile?.({ path: target.path, exact: true, ...target.place })
    }

    if (target.kind !== 'anchor') return

    const scroll = event.currentTarget.closest<HTMLElement>('[data-preview-scroll]')
    const top = scroll ? anchorTop(scroll, target.id) : null

    if (scroll && top !== null) scroll.scrollTop = top
  }

  // Средняя кнопка открыла бы путь новым окном: наружу уходит только сайт.
  const handleAuxClick = (event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()

  const handleZoomClose = () => setZoomed(null)

  if (target.kind === 'web') {
    return (
      <a className={styles.link} href={target.url} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  }

  if (target.kind === 'none') return <span className={styles.inertLink}>{children}</span>

  return (
    <>
      <a className={styles.link} href="#" onClick={handleClick} onAuxClick={handleAuxClick}>
        {children}
      </a>
      {zoomed && <ImageLightbox projectId={projectId} path={zoomed} onClose={handleZoomClose} />}
    </>
  )
}
