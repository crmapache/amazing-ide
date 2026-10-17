import { createRequire } from 'node:module'

import type * as Koffi from 'koffi'

import {
  RUSAGE_INFO_V0,
  LIB_SYSTEM_PATH,
  RUSAGE_INFO_V0_SIZE,
  PHYS_FOOTPRINT_OFFSET,
  PROC_PID_RUSAGE_SIGNATURE,
} from './usage.constants'

/** Физический след процесса в байтах. null - процесса уже нет или он чужой. */
export type FootprintReader = (pid: number) => number | null

type ProcPidRusage = (pid: number, flavor: number, buffer: Buffer) => number

/** Поле phys_footprint из ответа proc_pid_rusage. */
const parsePhysFootprint = (rusage: Buffer) => Number(rusage.readBigUInt64LE(PHYS_FOOTPRINT_OFFSET))

/**
 * proc_pid_rusage из libSystem через FFI. require - на первом замере, а не импортом:
 * сам koffi грузится около 25 мс, и запуск IDE их ждать не должен.
 */
const loadProcPidRusage = (): ProcPidRusage => {
  const koffi = createRequire(import.meta.url)('koffi') as typeof Koffi

  return koffi.load(LIB_SYSTEM_PATH).func(PROC_PID_RUSAGE_SIGNATURE)
}

// Один буфер на все вызовы: замер синхронный, и разобрать ответ успевают до следующего.
const rusage = Buffer.alloc(RUSAGE_INFO_V0_SIZE)

let reader: FootprintReader | null | undefined

/**
 * Читалка физического следа (phys_footprint) - той же цифры, что в столбце «Память»
 * Мониторинга системы. null - нативный вызов не загрузился: причина один раз уходит в
 * журнал, и память дальше не меряется, а не роняет каждый замер заново.
 */
export const loadFootprintReader = (): FootprintReader | null => {
  if (reader !== undefined) return reader

  try {
    const procPidRusage = loadProcPidRusage()

    reader = (pid) =>
      procPidRusage(pid, RUSAGE_INFO_V0, rusage) === 0 ? parsePhysFootprint(rusage) : null
  } catch (error) {
    console.warn('[usage] память процессов не измерить:', error)
    reader = null
  }

  return reader
}
