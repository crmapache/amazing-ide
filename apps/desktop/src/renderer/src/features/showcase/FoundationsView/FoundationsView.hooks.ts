import { useMemo } from 'react'

/**
 * Значения токенов так, как их видит окно: из вычисленных стилей корня, а не
 * переписанные руками. Поменяли токен - витрина показывает новое значение сама.
 */
export const useTokenValues = (tokens: readonly string[]): Readonly<Record<string, string>> =>
  useMemo(() => {
    const style = getComputedStyle(document.documentElement)

    return Object.fromEntries(tokens.map((token) => [token, style.getPropertyValue(token).trim()]))
  }, [tokens])
