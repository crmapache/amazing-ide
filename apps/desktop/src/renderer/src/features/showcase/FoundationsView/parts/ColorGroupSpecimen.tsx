import { useTranslation } from 'react-i18next'

import styles from '../FoundationsView.module.scss'
import type { ColorGroupProps } from '../FoundationsView.types'
import { tokenSample } from '../../showcase.utils'
import { Specimen } from '../../Specimen/Specimen'

/** Группа цветовых ролей: образец на клетке, имя токена и его значение в окне. */
export const ColorGroupSpecimen = ({ titleKey, tokens, values }: ColorGroupProps) => {
  const { t } = useTranslation('showcase')

  return (
    <Specimen label={t(titleKey)} layout="column">
      <div className={styles.swatches}>
        {tokens.map((token) => (
          <div key={token} className={styles.swatch}>
            {/* eslint-disable-next-line no-restricted-syntax -- цвет образца - из имени токена */}
            <span className={styles.chip} style={tokenSample('--sample', token)} />
            <span className={styles.meta}>
              <span className={styles.name}>{token}</span>
              <span className={styles.value}>{values[token]}</span>
            </span>
          </div>
        ))}
      </div>
    </Specimen>
  )
}
