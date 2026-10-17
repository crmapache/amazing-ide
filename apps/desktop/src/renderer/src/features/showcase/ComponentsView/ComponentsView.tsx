import styles from './ComponentsView.module.scss'
import { ActionsSection } from './parts/ActionsSection'
import { FieldsSection } from './parts/FieldsSection'
import { IndicatorsSection } from './parts/IndicatorsSection'
import { OverlaysSection } from './parts/OverlaysSection'
import { SurfacesSection } from './parts/SurfacesSection'

/**
 * Вкладка «Компоненты» витрины: каждый примитив packages/ui во всех вариантах и
 * состояниях, живой - на него можно навести, нажать, открыть.
 */
export const ComponentsView = () => (
  <div className={styles.componentsView}>
    <ActionsSection />
    <IndicatorsSection />
    <FieldsSection />
    <SurfacesSection />
    <OverlaysSection />
  </div>
)
