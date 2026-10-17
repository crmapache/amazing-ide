import clsx from 'clsx'

import styles from './Specimen.module.scss'
import type { SpecimenProps } from './Specimen.types'

/** Один образец в витрине: подпись и компонент или шкала на стеклянном листе. */
export const Specimen = ({ label, wide = false, layout = 'row', children }: SpecimenProps) => (
  <div className={clsx(styles.specimen, wide && styles.wide)}>
    <div className={styles.label}>{label}</div>
    <div className={styles[layout]}>{children}</div>
  </div>
)
