import styles from '../FoundationsView.module.scss'
import type { TokenScaleProps } from '../FoundationsView.types'
import { tokenSample } from '../../showcase.utils'

/**
 * Шкала токенов одного вида: отступы полосками, радиусы плитками, тени образцами.
 * Под каждым - имя и, если есть, значение.
 */
export const TokenScale = ({ kind, tokens, values }: TokenScaleProps) => (
  <div className={styles.scale}>
    {tokens.map((token) => (
      <div key={token} className={styles.scaleItem}>
        {/* eslint-disable-next-line no-restricted-syntax -- размер образца - из имени токена */}
        <span className={styles[kind]} style={tokenSample('--sample', token)} />
        <span className={styles.meta}>
          <span className={styles.name}>{token}</span>
          {values && <span className={styles.value}>{values[token]}</span>}
        </span>
      </div>
    ))}
  </div>
)
