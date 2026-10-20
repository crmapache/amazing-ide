import type { MouseEvent } from 'react'
import { X } from 'lucide-react'

import { useModalDialog } from '../Dialog/Dialog.hooks'
import { IconButton } from '../IconButton/IconButton'
import styles from './Lightbox.module.scss'
import type { LightboxProps } from './Lightbox.types'

/**
 * Картинка крупно поверх окна: скриншот из сообщения, вложение. Не вопрос, как Dialog,
 * а просмотр - закрывается крестиком, Esc и щелчком мимо картинки. Большая картинка
 * вписывается в окно, маленькая остаётся своего размера. Не нашлась - error словами.
 */
export const Lightbox = ({
  open,
  src,
  alt,
  loadingLabel,
  error,
  closeLabel,
  onClose,
}: LightboxProps) => {
  const ref = useModalDialog(open)

  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    // Щелчок по самому диалогу (затемнённым полям вокруг картинки) - мимо картинки.
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <dialog
      ref={ref}
      aria-label={alt}
      className={styles.lightbox}
      onClose={onClose}
      onClick={handleClick}>
      {src ? (
        <img className={styles.image} src={src} alt={alt} />
      ) : error ? (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      ) : (
        <div className={styles.loading}>{loadingLabel}</div>
      )}
      <div className={styles.close}>
        <IconButton icon={X} label={closeLabel} onClick={onClose} />
      </div>
    </dialog>
  )
}
