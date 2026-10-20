import { lazy } from 'react'

/**
 * Витрина дизайн-системы: действие «открыть или закрыть» для поиска везде и слой
 * поверх панелей, оба ленивые. Есть только в dev и в копии окна агента (флаг сборки
 * VITE_SHOWCASE, задан в electron.vite.config.ts). Условие стоит прямо здесь, а не
 * константой из другого модуля: только так сборщик сворачивает его и выбрасывает
 * ленивые импорты вместе с кодом витрины, её стором и переводами. В релизе здесь null.
 */
export const toggleShowcase =
  import.meta.env.DEV || import.meta.env.VITE_SHOWCASE === '1'
    ? () =>
        void import('../../features/showcase/showcase.store').then(({ useShowcaseStore }) =>
          useShowcaseStore.getState().toggle(),
        )
    : null

export const ShowcaseLayer =
  import.meta.env.DEV || import.meta.env.VITE_SHOWCASE === '1'
    ? lazy(() =>
        import('../../features/showcase/ShowcaseLayer/ShowcaseLayer').then((module) => ({
          default: module.ShowcaseLayer,
        })),
      )
    : null
