// Прогон стенда в том же Electron, что и у IDE. Каждый замер - новое окно (новый
// процесс отрисовки), одинаковый размер, одинаковый текст. Итог - таблица в консоль
// и results.json рядом.
//
//   pnpm install --ignore-workspace && pnpm bench
//
// Переменные: BENCH_QUICK=1 - один прогон на маленьком файле (проверить, что стенд
// жив); BENCH_ENGINES=codemirror,monaco - только эти движки (BENCH_ENTRIES - только их
// сборка); BENCH_FOCUS=1 - окно с
// фокусом (по умолчанию видно, но фокус у человека не забирает).

const { app, BrowserWindow, net, protocol } = require('electron')
const { existsSync, readdirSync, readFileSync, statSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')
const { pathToFileURL } = require('node:url')
const { gzipSync } = require('node:zlib')

const DIST = join(__dirname, 'dist')
const PROJECTS = join(__dirname, '..', '..', '..')

// Настоящие большие файлы из соседнего проекта. Нет проекта - сценарий пропускается.
const REAL_FILES = {
  'protocol.ts': join(PROJECTS, 'amazing-claude-code/webview/src/protocol.ts'),
  'App.tsx': join(PROJECTS, 'amazing-claude-code/webview/src/App.tsx'),
}

const QUICK = process.env.BENCH_QUICK === '1'
const FOCUS = process.env.BENCH_FOCUS === '1'
const ENGINES = process.env.BENCH_ENGINES?.split(',') ?? [
  'blank',
  'codemirror',
  'monaco',
  'monaco-shiki',
]
const RUNS = QUICK ? 1 : 5
const KEYSTROKES = 60
const KEY_INTERVAL_MS = 30

const lineCount = (path) => readFileSync(path, 'utf8').split('\n').length

const SCENARIOS = [
  { id: 'gen-2k', label: 'сгенерированный TS, 2 000 строк', query: 'lines=2000', typeAt: [0.5] },
  {
    id: 'gen-200k',
    label: 'сгенерированный TS, 200 000 строк',
    query: 'lines=200000',
    typeAt: [0.5],
  },
  ...Object.entries(REAL_FILES)
    .filter(([, path]) => existsSync(path))
    .map(([name, path]) => ({
      id: name,
      label: `${name}, ${lineCount(path)} строк`,
      query: `file=${name}`,
      typeAt: [0.5, 0.9],
    })),
].filter((scenario) => !QUICK || scenario.id === 'gen-2k')

// Своя схема, а не file://: у file:// в Chromium свои ограничения (воркеры, fetch),
// а сравнивать надо в одинаковых и обычных для веба условиях.
protocol.registerSchemesAsPrivileged([
  { scheme: 'bench', privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

// gc() в странице: память меряем после сборки мусора, а не с мусором загрузки.
app.commandLine.appendSwitch('js-flags', '--expose-gc')

// Окна закрываются после каждого замера; без этого Electron вышел бы на первом же.
app.on('window-all-closed', () => undefined)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const sorted = (values) => [...values].sort((left, right) => left - right)
const median = (values) => (values.length ? sorted(values)[Math.floor(values.length / 2)] : null)
const percentile = (values, fraction) =>
  values.length
    ? sorted(values)[Math.min(values.length - 1, Math.floor(values.length * fraction))]
    : null

const bundleSize = (engine) => {
  const walk = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name)

      return statSync(path).isDirectory() ? walk(path) : [path]
    })
  const files = walk(join(DIST, engine)).filter((path) => !path.endsWith('.html'))

  return {
    raw: files.reduce((sum, path) => sum + statSync(path).size, 0),
    gzip: files.reduce((sum, path) => sum + gzipSync(readFileSync(path), { level: 9 }).length, 0),
  }
}

const evaluate = (window, expression) => window.webContents.executeJavaScript(expression, true)

const waitForReady = async (window) => {
  for (let attempt = 0; attempt < 1200; attempt++) {
    const ready = await evaluate(window, 'window.__bench?.ready ?? null')

    if (ready) return ready
    await sleep(50)
  }

  throw new Error('страница не отчиталась о готовности за минуту')
}

// Сразу после закрытия прошлого окна загрузка изредка обрывается с ERR_FAILED -
// это гонка самого Electron, не движка. Одна повторная попытка снимает её.
const loadWithRetry = async (window, url) => {
  try {
    await window.loadURL(url)
  } catch {
    await sleep(500)
    await window.loadURL(url)
  }
}

const typeKeys = async (window) => {
  for (let index = 0; index < KEYSTROKES; index++) {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'x' })
    window.webContents.sendInputEvent({ type: 'char', keyCode: 'x' })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'x' })
    await sleep(KEY_INTERVAL_MS)
  }

  await sleep(500)
}

const runOnce = async (engine, scenario) => {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: { backgroundThrottling: false },
  })

  // Видимое, но без фокуса: без отрисовки замеры кадров врут, а забирать фокус у
  // человека за компьютером незачем. На задержку ввода фокус не влияет - проверено.
  if (FOCUS) {
    window.show()
    window.focus()
  } else {
    window.showInactive()
  }

  await loadWithRetry(window, `bench://app/${engine}/${engine}.html?${scenario.query}`)

  const ready = await waitForReady(window)

  // Дать фоновому разбору и раскраске успокоиться перед замером памяти.
  await sleep(1500)

  const heap = await evaluate(window, 'window.__bench.heap()')
  const pid = window.webContents.getOSProcessId()
  const metric = app.getAppMetrics().find((candidate) => candidate.pid === pid)
  const result = {
    readyMs: ready.readyMs,
    mountMs: ready.mountMs,
    heapMb: heap / 1024 / 1024,
    rendererMb: metric ? metric.memory.workingSetSize / 1024 : null,
    typing: {},
    typedOk: true,
  }

  if (engine !== 'blank') {
    window.webContents.focus()

    for (const fraction of scenario.typeAt) {
      const before = await evaluate(window, `window.__bench.prepareTyping(${fraction})`)

      await sleep(500)
      await typeKeys(window)

      const after = await evaluate(window, 'window.__bench.length()')

      result.typedOk &&= after - before === KEYSTROKES
      result.typing[fraction] = await evaluate(window, 'window.__bench.typingSamples()')
    }

    result.jumpToEndMs = await evaluate(window, 'window.__bench.jumpToEnd()')
  }

  window.destroy()
  await sleep(300)

  return result
}

const summarize = (runs, scenario) => {
  const pick = (key) => runs.map((run) => run[key]).filter((value) => typeof value === 'number')
  const typing = Object.fromEntries(
    scenario.typeAt.map((fraction) => {
      const samples = runs.flatMap((run) => run.typing[fraction] ?? [])

      return [
        fraction,
        {
          median: median(samples),
          p95: percentile(samples, 0.95),
          max: samples.length ? Math.max(...samples) : null,
        },
      ]
    }),
  )

  return {
    coldReadyMs: runs[0].readyMs,
    readyMs: median(pick('readyMs')),
    mountMs: median(pick('mountMs')),
    heapMb: median(pick('heapMb')),
    rendererMb: median(pick('rendererMb')),
    jumpToEndMs: median(pick('jumpToEndMs')),
    typing,
    typedOk: runs.every((run) => run.typedOk),
  }
}

const format = (value, digits = 0) => (typeof value === 'number' ? value.toFixed(digits) : '-')

const printReport = (report) => {
  console.log(`\nElectron ${report.electron}, Chromium ${report.chrome}, прогонов: ${RUNS}\n`)
  console.log('Размер сборки движка (js+css+шрифты+воркеры):')

  for (const [engine, data] of Object.entries(report.engines)) {
    const { raw, gzip } = data.bundle

    console.log(`  ${engine.padEnd(11)} ${format(raw / 1024)} КБ, gzip ${format(gzip / 1024)} КБ`)
  }

  console.log('\nМедианы: время в мс, память в МБ. Ввод: медиана/p95/макс от нажатия до кадра.\n')

  for (const scenario of SCENARIOS) {
    console.log(`== ${scenario.label}`)

    for (const [engine, data] of Object.entries(report.engines)) {
      const s = data.scenarios[scenario.id]

      if (!s) continue

      const typing = scenario.typeAt
        .map((fraction) => {
          const t = s.typing[fraction]

          return t.median === null
            ? ''
            : `ввод@${fraction * 100}% ${format(t.median, 1)}/${format(t.p95, 1)}/${format(t.max)}`
        })
        .filter(Boolean)
        .join('  ')

      console.log(
        [
          `  ${engine.padEnd(11)}`,
          `старт(1-й) ${format(s.coldReadyMs)}`,
          `старт ${format(s.readyMs)}`,
          `создание ${format(s.mountMs)}`,
          `heap ${format(s.heapMb, 1)}`,
          `окно ${format(s.rendererMb)}`,
          `в конец ${format(s.jumpToEndMs, 1)}`,
          typing,
          s.typedOk ? '' : 'ВВОД ПОТЕРЯН',
        ].join('  '),
      )
    }
  }
}

app
  .whenReady()
  .then(async () => {
    protocol.handle('bench', (request) => {
      const pathname = decodeURIComponent(new URL(request.url).pathname)
      const fileName = /\/files\/(.+)$/.exec(pathname)?.[1]
      const path = fileName ? REAL_FILES[fileName] : join(DIST, pathname)

      return net.fetch(pathToFileURL(path).toString())
    })

    const report = {
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      engines: {},
    }

    for (const engine of ENGINES) {
      report.engines[engine] = { bundle: bundleSize(engine), scenarios: {} }

      // Пустой странице другие сценарии не нужны: она - база памяти и старта.
      const scenarios = engine === 'blank' ? SCENARIOS.slice(0, 1) : SCENARIOS

      for (const scenario of scenarios) {
        const runs = []

        for (let run = 0; run < RUNS; run++) runs.push(await runOnce(engine, scenario))

        report.engines[engine].scenarios[scenario.id] = summarize(runs, scenario)
        console.log(`готово: ${engine}, ${scenario.label}`)
      }
    }

    writeFileSync(join(__dirname, 'results.json'), JSON.stringify(report, null, 2))
    printReport(report)
    app.quit()
  })
  .catch((error) => {
    console.error('стенд упал:', error)
    app.exit(1)
  })
