import type { CliMessage } from '../cli/cli-messages'
import { numberField, stringField } from '../cli/cli-messages'

/**
 * Отметка `command_lifecycle`: чья команда и что с ней; null - строка не отметка. CLI
 * отмечает так каждое наше сообщение (queued → started → completed | cancelled) - это его
 * собственный учёт хода, независимый от `result`.
 */
export const lifecycleOf = (message: CliMessage): { uuid: string; state: string } | null =>
  message.type === 'command_lifecycle'
    ? { uuid: stringField(message, 'command_uuid'), state: stringField(message, 'state') }
    : null

/** Команда кончилась: выполнена или снята остановкой. */
export const isFinalState = (state: string): boolean =>
  state === 'completed' || state === 'cancelled'

/**
 * Пустой итог, которым свежий процесс отвечает на старт (--resume), - рукопожатие, а не
 * конец хода: ноль шагов, ни текста, ни ошибки, и ни к какому нашему сообщению он не
 * привязан. Ответ на локальную команду (/compact, /clear) выглядит так же пусто, но несёт
 * её имя (`local_command`) и uuid нашего сообщения - это настоящий конец хода, и спутать
 * их нельзя: принятый за рукопожатие, он оставлял ход «в работе» навсегда, а Stop ждал итога,
 * которого CLI уже не пришлёт. Остановленный ход тоже кончается так, а не рукопожатием.
 */
export const isStartupResult = (result: CliMessage, fresh: boolean, stopping: boolean): boolean => {
  const answered = result['user_message_uuids']

  return (
    fresh &&
    !stopping &&
    numberField(result, 'num_turns') === 0 &&
    !stringField(result, 'result') &&
    result['is_error'] !== true &&
    !stringField(result, 'local_command') &&
    !stringField(result, 'user_message_uuid') &&
    !(Array.isArray(answered) && answered.length > 0)
  )
}
