import { callForResult, callFromMessage } from '../calls/call-reasons'
import type { CliMessage } from '../cli/cli-messages'
import { numberField, recordField, stringField } from '../cli/cli-messages'
import { outranks } from '../tabs/tab-names'
import {
  mergeCommands,
  titleFromReply,
  modelsFromReply,
  commandsFromInit,
  commandsFromChange,
} from './cli-replies'
import type { ConversationRuntime } from './conversation-runtime'
import { usageFromResult, liveContextTokens, usageFromContextReply } from './usage'

let modelsAsked = false

/**
 * Начало хода по `system/init`. Он приходит в голове каждого хода; если основного хода
 * не было, его начал сам CLI (досрочно закончился фоновый агент).
 */
const applyInit = (runtime: ConversationRuntime, init: CliMessage) => {
  const { meta, host, process } = runtime
  const sessionId = stringField(init, 'session_id')

  host.onCommands(
    meta.projectPath,
    mergeCommands(host.knownCommands(meta.projectPath), commandsFromInit(init)),
  )
  runtime.update({
    activeModel: stringField(init, 'model') || meta.activeModel,
    sessionId: sessionId || meta.sessionId,
  })

  if (!runtime.turnActive) {
    runtime.turnActive = true
    runtime.update({ turnStartedAt: Date.now() })
    runtime.syncStatus()
  }

  if (!modelsAsked && process) {
    modelsAsked = true
    process
      .control({ subtype: 'list_models' })
      .then((reply) => host.onModels(modelsFromReply(reply)))
      .catch(() => {
        modelsAsked = false
      })
  }
}

/** Заголовок от CLI по первому сообщению. Не вышло - спросим после следующего хода. */
const askTitle = (runtime: ConversationRuntime) => {
  const { process, titleSource } = runtime

  if (!process || !titleSource) return

  process
    .control({ subtype: 'generate_session_title', description: titleSource, persist: true })
    .then((reply) => {
      const title = titleFromReply(reply)

      if (!title) return

      runtime.titleSource = null

      // Имя, которое человек дал вкладке, пока модель думала, модель не перебивает.
      if (outranks('llm', runtime.meta.titleSource)) runtime.update({ title, titleSource: 'llm' })
    })
    .catch(() => undefined)
}

/**
 * Конец хода: итог в ленту, цифры контекста, заголовок и очередь. Пустой ход сразу
 * после старта с --resume (ноль шагов, ни текста, ни ошибки) - не конец настоящего
 * хода, который уже идёт, а рукопожатие нового процесса.
 */
/** Строки хода, которые после отката к нему уже не относятся к разговору. */
const STRAY_TYPES = new Set(['result', 'assistant', 'stream_event', 'user'])

const applyResult = (runtime: ConversationRuntime, result: CliMessage) => {
  const { feed, meta, process } = runtime
  const isEmpty =
    numberField(result, 'num_turns') === 0 &&
    !stringField(result, 'result') &&
    result['is_error'] !== true

  if (runtime.freshProcess && isEmpty) {
    runtime.freshProcess = false

    return
  }

  const interrupted = meta.stopRequestedAt !== null
  const isError = result['is_error'] === true

  runtime.freshProcess = false
  feed.builder.finishTurn(result, interrupted)
  // Файлы хода - по точным правкам и сверкой с диском, пока их никто не тронул. Список
  // уточняется синхронно, до отправки окну: промежуточного окно не видит.
  runtime.turnRevert.captureEnd().catch((error: unknown) => {
    console.warn('[claude] файлы хода не сверились:', error)
  })
  feed.flush()

  const stillWorking = feed.builder.hasBackgroundWork
  const call = callForResult(result, { interrupted, stillWorking })

  if (call) runtime.host.onCall(meta.id, call)

  runtime.turnActive = false
  runtime.update({
    turnStartedAt: null,
    stopRequestedAt: null,
    usage: { ...usageFromResult(result, meta.usage), costUsd: feed.builder.totalCostUsd },
    outcome: isError ? 'error' : 'done',
  })
  // Вопросы фоновых субагентов переживают конец хода: CLI ждёт на них ответа.
  runtime.syncStatus()

  process
    ?.control({ subtype: 'get_context_usage' })
    .then((reply) => runtime.update({ usage: usageFromContextReply(reply, runtime.meta.usage) }))
    .catch(() => undefined)

  if (!isError) askTitle(runtime)

  runtime.host.onUsageHint(runtime)
  runtime.afterTurn(!interrupted && !isError)
}

/**
 * Строка потока CLI - в ленту и в состояние разговора. Субагенты (`parent_tool_use_id`)
 * и их init ход не начинают и цифры контекста не трогают.
 */
export const routeMessage = (runtime: ConversationRuntime, message: CliMessage): void => {
  const { feed, host, meta } = runtime
  const isMain = !message['parent_tool_use_id']

  const isMainInit = message.type === 'system' && message.subtype === 'init' && !message['task_id']

  // Новый основной ход (его мог начать и сам CLI, когда досрочно кончился фоновый
  // агент) - уже не хвост отрезанного: иначе его итог потерялся бы, и разговор навсегда
  // остался бы «в работе».
  if (isMainInit && isMain) runtime.discardStray = false

  // Хвост хода, отрезанного откатом: CLI про него молчит, а то, что всё же пришло, - лишнее.
  if (runtime.discardStray && STRAY_TYPES.has(message.type)) return

  // Строки панели (прогресс вопроса сбоку, моды) - не события разговора: ленте их не нести.
  if (host.panel?.line(runtime, message)) return

  if (message.type === 'result') {
    applyResult(runtime, message)

    // Итог отработан (очередь, перезапуск): следующее слово - продолжение оборванной работы.
    return host.panel?.afterResult(runtime, message)
  }

  // Лимит и ошибка ответа зовут человека (звук, свечение вкладки).
  callFromMessage(runtime, message, isMain)

  // Картина лимита поменялась (CLI шлёт это, когда окно подходит к пределу или упёрлось).
  if (message.type === 'rate_limit_event') host.onUsageHint(runtime)

  // Лента держит дифф правки обрезанным для показа - точные правки хода копит откат.
  runtime.turnRevert.observe(message)
  feed.builder.apply(message)
  feed.schedule()

  // Фоновый субагент начал или кончил работу - точка вкладки говорит «работает» и после хода.
  if (meta.backgroundWork !== feed.builder.hasBackgroundWork) {
    runtime.update({ backgroundWork: feed.builder.hasBackgroundWork })
  }

  // Вход истёк: процесс держит мёртвый токен в памяти - следующий ход пусть идёт в новом.
  if (message.type === 'assistant' && message['error'] === 'authentication_failed') {
    runtime.restartProcess()
  }

  if (isMainInit) {
    applyInit(runtime, message)
  } else if (message.type === 'system' && message.subtype === 'commands_changed') {
    host.onCommands(meta.projectPath, commandsFromChange(message))
  } else if (message.type === 'conversation_reset') {
    // /clear: CLI начал новый разговор под новым id - вкладка продолжает уже его, а
    // контекст и цена того разговора к этому отношения не имеют.
    feed.forgetEarlier()
    runtime.update({
      sessionId: stringField(message, 'new_conversation_id') || meta.sessionId,
      usage: { ...meta.usage, contextTokens: 0 },
    })
  } else if ((message.type === 'assistant' || message.type === 'stream_event') && isMain) {
    runtime.freshProcess = false
  }

  if (message.type === 'assistant' && isMain) {
    const tokens = liveContextTokens(message)
    const model = stringField(recordField(message, 'message'), 'model')
    const isRealModel = Boolean(model) && !model.startsWith('<')

    if (tokens > 0 || isRealModel) {
      runtime.update({
        usage: tokens > 0 ? { ...meta.usage, contextTokens: tokens } : meta.usage,
        activeModel: isRealModel ? model : meta.activeModel,
      })
    }
  }
}
