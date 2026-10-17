import { it, expect, describe } from 'vitest'

import { loadFootprintReader } from './phys-footprint'

// Настоящий proc_pid_rusage на процессе самого теста: проверяет и то, что koffi
// загружается, и то, что смещение поля в структуре верное, а не придумано.
describe('loadFootprintReader', () => {
  const MB = 1024 * 1024

  it('reads the footprint of a live process', () => {
    const readFootprint = loadFootprintReader()
    const footprint = readFootprint?.(process.pid) ?? 0

    expect(footprint).toBeGreaterThan(MB)
    expect(footprint).toBeLessThan(64 * 1024 * MB)
  })

  it('follows memory the process actually touches', () => {
    const readFootprint = loadFootprintReader()
    const before = readFootprint?.(process.pid) ?? 0
    // Заполнить, а не только выделить: нулевые страницы macOS отдаёт лениво, и в след
    // они попадают, когда в них пишут.
    const ballast = Buffer.alloc(128 * MB).fill(1)
    const after = readFootprint?.(process.pid) ?? 0

    expect(ballast.at(-1)).toBe(1)
    expect(after - before).toBeGreaterThan(100 * MB)
  })

  it('returns null for a process that does not exist', () => {
    const readFootprint = loadFootprintReader()

    expect(readFootprint).not.toBeNull()
    expect(readFootprint?.(2 ** 31 - 1)).toBeNull()
  })
})
