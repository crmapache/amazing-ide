import type { CliMessage } from '../cli/cli-messages'
import { stringField } from '../cli/cli-messages'

/**
 * Когда случилась строка CLI. У строки транскрипта своё время (`timestamp`), и прошлый
 * разговор должен показывать его, а не момент, когда его прочитали; у живой строки
 * времени нет - она случилась сейчас.
 */
export const lineTime = (message: CliMessage, now: number): number => {
  const stamp = stringField(message, 'timestamp')
  const parsed = stamp ? Date.parse(stamp) : Number.NaN

  return Number.isFinite(parsed) ? parsed : now
}
