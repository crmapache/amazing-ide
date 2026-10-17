import { useTranslation } from 'react-i18next'

import { FONT_SIZES, FONT_WEIGHTS } from '../FoundationsView.constants'
import styles from '../FoundationsView.module.scss'
import type { TypeScaleProps } from '../FoundationsView.types'
import { tokenSample } from '../../showcase.utils'
import { Specimen } from '../../Specimen/Specimen'

/** Шкала кеглей, насыщенности системного шрифта и образец кода на JetBrains Mono. */
export const TypeScaleSpecimens = ({ values }: TypeScaleProps) => {
  const { t } = useTranslation('showcase')
  const sample = t('samples.typeSample')

  return (
    <>
      <Specimen label={t('sections.typography')} layout="column" wide>
        {FONT_SIZES.map((token) => (
          <div key={token} className={styles.typeRow}>
            <span className={styles.typeName}>
              <span className={styles.name}>{token}</span>
              <span className={styles.value}> {values[token]}</span>
            </span>
            {/* eslint-disable-next-line no-restricted-syntax -- кегль образца - из имени токена */}
            <span className={styles.typeSample} style={tokenSample('--sample', token)}>
              {sample}
            </span>
          </div>
        ))}
      </Specimen>
      <Specimen label={t('groups.weights')} layout="column">
        {FONT_WEIGHTS.map((token) => (
          <div key={token} className={styles.scaleItem}>
            {/* eslint-disable-next-line no-restricted-syntax -- насыщенность - из имени токена */}
            <span className={styles.weightSample} style={tokenSample('--sample', token)}>
              {sample}
            </span>
            <span className={styles.name}>{`${token} ${values[token] ?? ''}`}</span>
          </div>
        ))}
      </Specimen>
      <Specimen label={t('groups.code')} layout="column">
        <code className={styles.codeSample}>{t('samples.codeSample')}</code>
        <span className={styles.name}>{'--font-code'}</span>
      </Specimen>
    </>
  )
}
