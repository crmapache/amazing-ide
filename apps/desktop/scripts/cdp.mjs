import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

/**
 * Окно IDE глазами агента: снимок экрана и выполнение выражения в странице через
 * Chrome DevTools Protocol. Без Playwright и без зависимостей - WebSocket есть в Node.
 *
 * Окно должно быть запущено с открытым портом отладки:
 *   dev:        AMAZING_IDE_CDP_PORT=5316 pnpm dev
 *   собранное:  "/Applications/Amazing IDE.app/Contents/MacOS/Amazing IDE" --remote-debugging-port=5316
 *
 * Команды:
 *   node scripts/cdp.mjs screenshot [файл.png]     снимок окна (по умолчанию .screenshots/window.png)
 *   node scripts/cdp.mjs eval "<выражение>"        результат выражения в странице, JSON
 *   node scripts/cdp.mjs click "<css-селектор>"    клик по элементу
 */

const port = process.env.AMAZING_IDE_CDP_PORT ?? '5316'
const [command, argument] = process.argv.slice(2)

const findPageSocketUrl = async () => {
  const response = await fetch(`http://127.0.0.1:${port}/json`)
  const targets = await response.json()
  const page = targets.find((target) => target.type === 'page')

  if (!page) throw new Error(`На порту ${port} нет страницы. Окно запущено с отладкой?`)

  return page.webSocketDebuggerUrl
}

const connect = async () => {
  const socket = new WebSocket(await findPageSocketUrl())
  const pending = new Map()
  let nextId = 1

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    const request = pending.get(message.id)

    if (!request) return

    pending.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.resolve(message.result)
  })

  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true })
    socket.addEventListener('error', rejectOpen, { once: true })
  })

  const send = (method, params = {}) =>
    new Promise((resolveSend, rejectSend) => {
      const id = nextId++

      pending.set(id, { resolve: resolveSend, reject: rejectSend })
      socket.send(JSON.stringify({ id, method, params }))
    })

  return { send, close: () => socket.close() }
}

const evaluate = async (send, expression) => {
  const { result, exceptionDetails } = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })

  if (exceptionDetails)
    throw new Error(exceptionDetails.exception?.description ?? 'ошибка в странице')

  return result.value
}

const { send, close } = await connect()

try {
  if (command === 'screenshot') {
    const file = resolve(argument ?? '.screenshots/window.png')
    const { data } = await send('Page.captureScreenshot', { format: 'png' })

    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, Buffer.from(data, 'base64'))
    console.log(file)
  } else if (command === 'eval') {
    console.log(JSON.stringify(await evaluate(send, argument), null, 2))
  } else if (command === 'click') {
    const selector = JSON.stringify(argument)
    const clicked = await evaluate(
      send,
      `(() => { const el = document.querySelector(${selector}); el?.click(); return Boolean(el) })()`,
    )

    if (!clicked) throw new Error(`Не нашёл элемент ${argument}`)
    console.log('ok')
  } else {
    console.error('Команды: screenshot [файл] | eval "<выражение>" | click "<селектор>"')
    process.exitCode = 1
  }
} finally {
  close()
}
