import type { JsonFile } from '../storage/json-file'
import type { StoredClaude } from './claude-state'
import { STATE_SAVE_MS, STATE_BROADCAST_MS } from './claude.constants'

/**
 * Рассылка состояния окну и запись вкладок на диск - пачкой по таймеру: десяток
 * изменений за такт - одно событие и одна запись. Что писать и что слать, знает
 * ClaudeService: здесь только когда.
 */
export class ClaudePersistence {
  private broadcastTimer: NodeJS.Timeout | null = null
  private saveTimer: NodeJS.Timeout | null = null

  constructor(
    private readonly file: JsonFile<StoredClaude>,
    private readonly snapshot: () => StoredClaude,
    private readonly broadcast: () => void,
  ) {}

  /** Поменялось то, что хранится: разослать окну и записать на диск. */
  changed() {
    this.scheduleBroadcast()
    this.saveTimer ??= setTimeout(() => void this.save(), STATE_SAVE_MS)
  }

  /** Поменялось только видимое окну (лимиты, команды): записывать нечего. */
  scheduleBroadcast() {
    this.broadcastTimer ??= setTimeout(() => {
      this.broadcastTimer = null
      this.broadcast()
    }, STATE_BROADCAST_MS)
  }

  async save() {
    if (this.saveTimer) clearTimeout(this.saveTimer)

    this.saveTimer = null

    await this.file
      .write(this.snapshot())
      .catch((error: unknown) => console.warn('[claude] разговоры не сохранились:', error))
  }
}
