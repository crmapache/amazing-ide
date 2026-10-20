import { SECOND_MS } from '../claude.constants'

/** Часы строки плана: момент - в минутах, строка уходит в свой срок с точностью до полминуты. */
export const CARRY_ON_TICK_MS = 30 * SECOND_MS
