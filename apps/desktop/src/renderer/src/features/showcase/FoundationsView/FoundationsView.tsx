import { useTranslation } from 'react-i18next'

import { ShowcaseSection } from '../ShowcaseSection/ShowcaseSection'
import { Specimen } from '../Specimen/Specimen'
import { RADII, SPACES, SHADOWS, COLOR_GROUPS, VALUE_TOKENS } from './FoundationsView.constants'
import { useTokenValues } from './FoundationsView.hooks'
import styles from './FoundationsView.module.scss'
import { ColorGroupSpecimen } from './parts/ColorGroupSpecimen'
import { TokenScale } from './parts/TokenScale'
import { TypeScaleSpecimens } from './parts/TypeScaleSpecimens'

/**
 * Вкладка «Основа» витрины: цветовые роли, шрифты, отступы, радиусы и тени.
 * Значения читаются из окна, а не дублируются здесь.
 */
export const FoundationsView = () => {
  const { t } = useTranslation('showcase')
  const values = useTokenValues(VALUE_TOKENS)

  return (
    <div className={styles.foundationsView}>
      <ShowcaseSection title={t('sections.colors')}>
        {COLOR_GROUPS.map((group) => (
          <ColorGroupSpecimen key={group.titleKey} {...group} values={values} />
        ))}
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.typography')}>
        <TypeScaleSpecimens values={values} />
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.spacing')}>
        <Specimen label={t('sections.spacing')} wide>
          <TokenScale kind="space" tokens={SPACES} values={values} />
        </Specimen>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.shape')}>
        <Specimen label={t('sections.shape')} wide>
          <TokenScale kind="radius" tokens={RADII} values={values} />
        </Specimen>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.elevation')}>
        <Specimen label={t('sections.elevation')} wide>
          <TokenScale kind="shadow" tokens={SHADOWS} />
        </Specimen>
      </ShowcaseSection>
    </div>
  )
}
