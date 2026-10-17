import styles from './ShowcaseSection.module.scss'
import type { ShowcaseSectionProps } from './ShowcaseSection.types'

/** Раздел витрины: крупный заголовок и сетка образцов (Specimen) под ним. */
export const ShowcaseSection = ({ title, children }: ShowcaseSectionProps) => (
  <section aria-label={title} className={styles.showcaseSection}>
    <h2 className={styles.title}>{title}</h2>
    <div className={styles.grid}>{children}</div>
  </section>
)
