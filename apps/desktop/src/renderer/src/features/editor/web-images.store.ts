import { create } from 'zustand'

import { documentKey } from './documents.utils'

const NONE: readonly string[] = []

type WebImagesStore = {
  /** Адреса картинок с сайтов, которые человек разрешил показать, - по документу. */
  allowed: Record<string, readonly string[]>
  allow: (projectId: string, path: string, urls: readonly string[]) => void
}

/**
 * Картинки с сайтов в просмотре Markdown - только по нажатию «показать», и только те
 * адреса, что были в файле в этот момент (ADR 0019). Иначе агент, поймавший чужую
 * инструкцию, вписал бы в открытый README картинку с секретом в адресе, и окно само
 * отправило бы его наружу. Новый адрес после правки снова ждёт нажатия. Помнится, пока
 * окно живо.
 */
export const useWebImagesStore = create<WebImagesStore>()((set) => ({
  allowed: {},
  allow: (projectId, path, urls) =>
    set((state) => {
      const key = documentKey(projectId, path)

      return {
        allowed: {
          ...state.allowed,
          [key]: [...new Set([...(state.allowed[key] ?? []), ...urls])],
        },
      }
    }),
}))

/** Разрешённые адреса картинок с сайтов в файле. */
export const useAllowedWebImages = (projectId: string, path: string): readonly string[] =>
  useWebImagesStore((state) => state.allowed[documentKey(projectId, path)] ?? NONE)
