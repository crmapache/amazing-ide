import type { ModelInfo } from './claude'
import type { FastReport } from './claude-panel'

/**
 * Быстрый режим (/fast): Opus до 2.5 раза быстрее за счёт usage credits. Две половины из
 * двух мест: попросили ли - знает панель, работает ли - говорит CLI в начале и в конце
 * каждого хода. Одна функция читает их вместе, чтобы меню, чип и строка не расходились.
 */

/** Слово CLI «хост ещё не попросил» и «ещё выясняю»: это не отказ. */
const NOT_ASKED = 'sdk_opt_in_required'
const CHECKING = 'pending'

/**
 * Что показать: не просили; просили, а CLI ещё не ответил (ответит в начале следующего
 * хода); работает; пауза после лимита; недоступен - с причиной словом CLI.
 */
export type FastModeShown =
  | { kind: 'off' }
  | { kind: 'waiting' }
  | { kind: 'on' }
  | { kind: 'cooldown' }
  | { kind: 'unavailable'; reason: string }

export const fastModeShown = (
  asked: boolean | undefined,
  report: FastReport | undefined,
): FastModeShown => {
  if (!asked) return { kind: 'off' }
  if (!report) return { kind: 'waiting' }
  if (report.state === 'on') return { kind: 'on' }
  if (report.state === 'cooldown') return { kind: 'cooldown' }

  const { reason } = report

  return !reason || reason === NOT_ASKED || reason === CHECKING
    ? { kind: 'waiting' }
    : { kind: 'unavailable', reason }
}

/** Модель без метки окна: «claude-opus-5-5[1m]» → «claude-opus-5-5». */
const unmarked = (model: string) => model.replace(/\[[^\]]*\]$/, '')

/** Правило самого CLI по имени, когда каталога нет: Opus 4.8 и семья Opus 5. */
const byName = (model: string) => {
  const name = unmarked(model).toLowerCase()

  return name === 'opus' || name.includes('opus-4-8') || name.includes('opus-5')
}

/**
 * Есть ли у модели быстрый режим по слову каталога CLI (`supportsFastMode`): точное
 * значение отвечает за себя, имя не из меню сверяется с развёрнутыми именами без метки
 * окна. null - каталог не сказал (короткое «opus» - семья, за Opus 4.7 не поручится).
 */
const catalogFastMode = (models: readonly ModelInfo[], model: string): boolean | null => {
  const exact = models.find((option) => option.value === model)

  if (exact) return exact.fast ?? null

  const resolved = models.find(
    (option) => option.resolved && unmarked(option.resolved) === unmarked(model),
  )

  return resolved?.fast ?? null
}

/**
 * Предлагать ли быстрый режим для модели (null - «по умолчанию»): по каталогу, а без
 * каталога - по правилу самого CLI.
 */
export const modelHasFastMode = (models: readonly ModelInfo[], model: string | null): boolean => {
  const name = model ?? 'default'

  return catalogFastMode(models, name) ?? (models.length === 0 && byName(name))
}

/**
 * Снимает ли выбор модели быстрый режим: модель без него его выключает, и сам он не
 * вернётся. Каталог не сказал - не трогать: выключить работающий режим хуже.
 */
export const losesFastMode = (models: readonly ModelInfo[], model: string | null): boolean => {
  const name = model ?? 'default'
  const known = catalogFastMode(models, name)

  return known === null ? models.length === 0 && model !== null && !byName(name) : !known
}
