import type { ParseKeys } from 'i18next'

/** Группа цветовых токенов в витрине: заголовок и имена ролей. */
export type ColorGroup = {
  titleKey: ParseKeys<'showcase'>
  tokens: readonly string[]
}

/** Как показать образец шкалы: какое свойство образца берёт токен. */
export type ScaleKind = 'space' | 'radius' | 'shadow'

export type ColorGroupProps = ColorGroup & {
  values: Readonly<Record<string, string>>
}

export type TokenScaleProps = {
  kind: ScaleKind
  tokens: readonly string[]
  /** Значение рядом с именем. У теней оно длинное и не нужно. */
  values?: Readonly<Record<string, string>> | undefined
}

export type TypeScaleProps = {
  values: Readonly<Record<string, string>>
}
