import '../showcase.i18n'

import { useShowcaseStore } from '../showcase.store'
import { Showcase } from '../Showcase/Showcase'

/**
 * Слой витрины поверх панелей окна: пока витрина закрыта, ничего не рисует. Отдельно
 * от Showcase, чтобы рабочая область не знала про стор витрины - в релизной сборке
 * этот модуль вместе со стором не попадает в бандл.
 */
export const ShowcaseLayer = () => {
  const isOpen = useShowcaseStore((state) => state.isOpen)

  return isOpen ? <Showcase /> : null
}
