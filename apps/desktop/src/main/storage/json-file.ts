import { mkdir, rename, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

/**
 * JSON-файл с состоянием приложения в userData. Запись атомарная: сначала во
 * временный файл, потом rename - оборванная запись не оставит полфайла.
 */
export class JsonFile<T> {
  constructor(private readonly path: string) {}

  /** Содержимое файла или null, если файла нет или он не разбирается. */
  async read(): Promise<unknown> {
    try {
      return JSON.parse(await readFile(this.path, 'utf8')) as unknown
    } catch {
      return null
    }
  }

  async write(value: T): Promise<void> {
    const temporary = `${this.path}.tmp`

    await mkdir(dirname(this.path), { recursive: true })
    await writeFile(temporary, JSON.stringify(value, null, 2), 'utf8')
    await rename(temporary, this.path)
  }
}
