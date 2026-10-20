import type { PanelHooks } from '../panel/panel-hooks'

/**
 * Строки потока CLI. Протокол не наш и растёт от версии к версии, поэтому тип
 * открытый: читаем только известные поля и проверяем их на месте. Список того, что
 * приходит, - ADR 0009 и отчёт о протоколе в его фактах.
 */
export type CliMessage = { type: string; subtype?: string; [field: string]: unknown }

/** Кто ещё слушает строки CLI разговора. */
export type CliTap = {
  /** Служебные возможности панели (panel/): /btw, моды, модель, продолжения. Нет - тесты. */
  panel?: PanelHooks
}

/** Управляющий запрос CLI к хосту: вопрос разрешения и подобное. */
export type ControlRequest = CliMessage & {
  type: 'control_request' | 'control_cancel_request'
  request_id: string
  request?: { subtype?: string; [field: string]: unknown }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Одна строка stdout в сообщение. Не JSON (CLI иногда пишет диагностику прямо в
 * stdout) - null: такая строка в ленту не попадает.
 */
export const parseCliLine = (line: string): CliMessage | null => {
  const trimmed = line.trim()

  if (!trimmed.startsWith('{')) return null

  try {
    const value: unknown = JSON.parse(trimmed)

    return isRecord(value) && typeof value['type'] === 'string' ? (value as CliMessage) : null
  } catch {
    return null
  }
}

export const isControlRequest = (message: CliMessage): message is ControlRequest =>
  (message.type === 'control_request' || message.type === 'control_cancel_request') &&
  typeof message['request_id'] === 'string'

export { isRecord }

/** Строка поля или пустая строка. */
export const stringField = (record: Record<string, unknown>, key: string): string => {
  const value = record[key]

  return typeof value === 'string' ? value : ''
}

/** Число поля или 0. */
export const numberField = (record: Record<string, unknown>, key: string): number => {
  const value = record[key]

  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/** Вложенный объект поля или пустой объект. */
export const recordField = (
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> => {
  const value = record[key]

  return isRecord(value) ? value : {}
}

/** Массив объектов поля, без мусора внутри. */
export const recordsField = (
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown>[] => {
  const value = record[key]

  return Array.isArray(value) ? value.filter(isRecord) : []
}
