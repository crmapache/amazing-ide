import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

// Тесты - на чистую логику главного процесса и общего контракта: разбор манифеста
// обновлений, сравнение версий, защита путей. Окно и Electron в них не поднимаются.
export default defineConfig({
  resolve: {
    alias: { '@shared': resolve(import.meta.dirname, 'src/shared') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
