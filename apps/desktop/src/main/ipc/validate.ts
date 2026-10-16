/** Проверки данных из окна. Окно своё, но граница процессов всё равно граница. */

export const assertString: (value: unknown, name: string) => asserts value is string = (
  value,
  name,
) => {
  if (typeof value !== 'string') throw new Error(`Ожидалась строка в поле ${name}`)
}

export const assertOneOf = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  name: string,
): T => {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`Недопустимое значение в поле ${name}`)
  }

  return value as T
}
