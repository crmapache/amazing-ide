import type { ModelInfo } from '@shared/claude'

/** Модель для меню: из каталога CLI или добавленная руками (Settings → Custom models). */
export type PickableModel = ModelInfo & { custom: boolean }
