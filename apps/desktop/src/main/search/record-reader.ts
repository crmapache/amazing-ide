/** Запись из полей. clipped - какое-то поле длиннее предела и обрезано. */
export type ByteRecord = { fields: string[]; clipped: boolean }

/**
 * Режет поток байтов на записи из полей. Разделители полей идут по кругу: у
 * `git ls-files -z` это [\0], у `git grep -z -n` - [\0, \0, \n] (путь, номер, текст).
 *
 * Режем по байтам, а не по строке: кусок потока может оборваться посреди буквы
 * UTF-8, а байты \0 и \n внутри многобайтной буквы не встречаются. Каждое поле
 * ищет свой разделитель, поэтому \n в имени файла и \0 в тексте строки не ломают
 * разбор.
 *
 * Поле держится не длиннее maxFieldBytes: строка source map или бандла бывает в
 * десятки мегабайт, и склеивать и разбирать её целиком ради превью в 160 символов -
 * это память и секунды синхронной работы. Остаток поля до разделителя пропускается.
 */
export class RecordReader {
  private fields: string[] = []
  private parts: Buffer[] = []
  private keptBytes = 0
  private fieldClipped = false
  private recordClipped = false

  constructor(
    private readonly delimiters: readonly number[],
    private readonly maxFieldBytes = Number.POSITIVE_INFINITY,
  ) {}

  /** Записи, которые закончились в этом куске. Начатая запись ждёт следующего. */
  push(chunk: Buffer): ByteRecord[] {
    const records: ByteRecord[] = []
    let start = 0

    while (start < chunk.length) {
      const delimiter = this.delimiters[this.fields.length] ?? 0
      const end = chunk.indexOf(delimiter, start)

      if (end === -1) {
        this.keep(chunk.subarray(start))
        break
      }

      this.keep(chunk.subarray(start, end))
      this.fields.push(this.takeField())
      start = end + 1

      if (this.fields.length === this.delimiters.length) {
        records.push({ fields: this.fields, clipped: this.recordClipped })
        this.fields = []
        this.recordClipped = false
      }
    }

    return records
  }

  /** Байты поля сверх предела не копятся вовсе. */
  private keep(piece: Buffer): void {
    const room = Math.max(this.maxFieldBytes - this.keptBytes, 0)

    if (piece.length > room) this.fieldClipped = true

    const part = piece.length > room ? piece.subarray(0, room) : piece

    if (part.length === 0) return

    this.parts.push(part)
    this.keptBytes += part.length
  }

  private takeField(): string {
    const bytes = Buffer.concat(this.parts)
    // Обрезка могла прийтись посреди буквы. В потоковом режиме TextDecoder
    // придерживает неполную букву в конце, а не подставляет «�», - дочитывать её
    // никто не станет, и она просто пропадает.
    const text = this.fieldClipped
      ? new TextDecoder().decode(bytes, { stream: true })
      : bytes.toString('utf8')

    this.recordClipped ||= this.fieldClipped
    this.parts = []
    this.keptBytes = 0
    this.fieldClipped = false

    return text
  }
}
