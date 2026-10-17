import styles from './Card.module.scss'
import type { CardProps } from './Card.types'

/**
 * Стеклянная карточка внутри панели: заголовок, строка пояснения, действия справа и
 * содержимое. Для группы настроек, сводки, блока в GUI провайдера. Всплывающее
 * поверх окна - Popover или Dialog, не карточка.
 */
export const Card = ({ title, description, actions, children }: CardProps) => {
  const hasHeader = Boolean(title || actions)

  return (
    <section aria-label={title} className={styles.card}>
      {hasHeader && (
        <>
          <div className={styles.header}>
            <div className={styles.heading}>
              {title && <div className={styles.title}>{title}</div>}
              {description && <div className={styles.description}>{description}</div>}
            </div>
            {actions && <div className={styles.actions}>{actions}</div>}
          </div>
          <div className={styles.divider} />
        </>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
