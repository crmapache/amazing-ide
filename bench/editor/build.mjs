import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'vite'

// Каждый движок - отдельная сборка в свою папку: так размер считается честно, без
// общих чанков между ними.
const root = dirname(fileURLToPath(import.meta.url))

for (const entry of process.env.BENCH_ENTRIES?.split(',') ?? [
  'blank',
  'codemirror',
  'monaco',
  'monaco-shiki',
]) {
  await build({
    root,
    base: './',
    logLevel: 'warn',
    build: {
      outDir: `dist/${entry}`,
      emptyOutDir: true,
      minify: true,
      chunkSizeWarningLimit: 10_000,
      rolldownOptions: { input: `${entry}.html` },
    },
  })
}
