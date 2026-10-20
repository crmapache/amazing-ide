import { BranchSwitcher } from '../../features/git/BranchSwitcher/BranchSwitcher'
import { ProjectSwitcher } from '../../features/projects/ProjectSwitcher/ProjectSwitcher'
import styles from './TitleBar.module.scss'

/**
 * Шапка окна, как в WebStorm: слева проект и ветка, справа кнопок нет - поиск везде
 * открывается двойным Shift и сочетаниями, витрина дизайн-системы (в dev) - действием
 * поиска. Окно таскают за пустые места - место под «светофор» и распорку до правого
 * края; кнопки в область перетаскивания не попадают.
 */
export const TitleBar = () => (
  <header className={styles.titleBar}>
    <div className={styles.trafficLights} />
    <div className={styles.start}>
      <ProjectSwitcher />
      <BranchSwitcher />
    </div>
    <div className={styles.dragSpace} />
  </header>
)
