import type { IdeBridge } from '../shared/ipc/bridge'

declare global {
  interface Window {
    /** Мост к главному процессу. Выставляет preload, читает только lib/ipc.ts. */
    ide: IdeBridge
  }
}

export {}
