import { resolve } from 'node:path'

import { defineConfig } from 'electron-vite'

import react from '@vitejs/plugin-react'

const shared = resolve(__dirname, 'src/shared')

export default defineConfig({
  main: {
    resolve: { alias: { '@shared': shared } },
  },
  preload: {
    resolve: { alias: { '@shared': shared } },
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: { '@shared': shared },
      // Одна копия React на всё окно: пакет дизайн-системы лежит отдельно и без
      // этого может притащить свою, а две копии ломают хуки.
      dedupe: ['react', 'react-dom'],
    },
    // Порт закреплён и записан в ~/.claude/ports.md. Без strictPort Vite молча
    // уезжает на соседний порт, и окно грузится не оттуда, откуда ждёшь.
    server: { port: 5315, strictPort: true },
    // electron-vite по умолчанию не сжимает рендерер. Окно грузит бандл с диска, но
    // разбирать JS движку всё равно приходится: меньше код - быстрее первый кадр.
    build: { minify: true },
  },
})
