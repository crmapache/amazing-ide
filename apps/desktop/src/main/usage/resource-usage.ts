import { app } from 'electron'

import type { ResourceUsage } from '@shared/app-info'

import { loadFootprintReader } from './phys-footprint'

/**
 * Процессор и память всех процессов IDE: главного, окна, GPU и служебных.
 *
 * Процессор - из Electron. Это среднее с прошлого вызова getAppMetrics, и интервал у
 * всех вызовов общий, поэтому getAppMetrics зовёт только этот замер. Память - из
 * macOS: workingSetSize у Electron - это RSS, где общие страницы фреймворка посчитаны
 * в каждом процессе заново, и сумма выходит в три-четыре раза больше «Мониторинга
 * системы» (docs/adr/0008-resource-usage.md).
 */
export const readResourceUsage = (): ResourceUsage => {
  const processes = app.getAppMetrics()
  const readFootprint = loadFootprintReader()

  return {
    cpuPercent: processes.reduce((total, { cpu }) => total + cpu.percentCPUUsage, 0),
    // Процесс, который завершился между замерами, памяти уже не занимает.
    memoryBytes: readFootprint
      ? processes.reduce((total, { pid }) => total + (readFootprint(pid) ?? 0), 0)
      : null,
  }
}
