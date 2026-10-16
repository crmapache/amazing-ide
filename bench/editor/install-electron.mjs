import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { join, dirname } from 'node:path'

/**
 * Ставит бинарник Electron.
 *
 * С 43-й версии Electron убрал postinstall и качает бинарник лениво, при первом
 * запуске. Но electron-vite и electron-builder обращаются к нему напрямую и без него
 * падают с «Electron uninstall», поэтому ставим сами (так же сделано в snakein).
 *
 * SKIP_ELECTRON_BINARY=1 пропускает закачку - для машин, где десктоп не собирают.
 */
if (process.env.SKIP_ELECTRON_BINARY === '1') {
  console.log('SKIP_ELECTRON_BINARY=1 - бинарник Electron не качаем')
  process.exit(0)
}

const require = createRequire(import.meta.url)
const installScript = join(dirname(require.resolve('electron')), 'install.js')

execFileSync(process.execPath, [installScript], { stdio: 'inherit' })
