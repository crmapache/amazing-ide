import { MB_IN_GB, BYTES_IN_MB } from './ResourceUsage.constants'
import type { MemoryReading } from './ResourceUsage.types'

/** Байты - в целые мегабайты, а от гигабайта - в гигабайты с одним знаком. */
export const formatMemory = (bytes: number): MemoryReading => {
  const megabytes = Math.round(bytes / BYTES_IN_MB)

  if (megabytes < MB_IN_GB) return { unit: 'mb', value: String(megabytes) }

  return { unit: 'gb', value: (bytes / BYTES_IN_MB / MB_IN_GB).toFixed(1) }
}
