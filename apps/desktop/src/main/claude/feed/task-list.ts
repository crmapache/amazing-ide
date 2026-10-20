import type { TaskEntry, TaskState } from '@shared/claude-feed'

import { isRecord, recordField, stringField, recordsField } from '../cli/cli-messages'

const TASK_STATES = new Set<string>(['pending', 'in_progress', 'completed'])

const toState = (value: string): TaskState =>
  TASK_STATES.has(value) ? (value as TaskState) : 'pending'

/** Инструменты, из которых складывается список задач. В ленту они строкой не идут. */
export const TASK_LIST_TOOLS = new Set(['TodoWrite', 'TaskCreate', 'TaskUpdate'])

/**
 * Список задач разговора - так, как его ведёт модель. TodoWrite присылает список
 * целиком, TaskCreate добавляет задачу (номер известен только из результата),
 * TaskUpdate меняет одну по номеру. Окно рисует его панелью над полем ввода.
 */
export class TaskList {
  private entries: TaskEntry[] = []
  /** Созданные задачи ждут номера из результата вызова. */
  private readonly awaitingId = new Map<string, TaskEntry>()

  get tasks(): TaskEntry[] {
    return this.entries
  }

  /** Вызов инструмента. true - список изменился. */
  applyToolUse(toolUseId: string, name: string, input: Record<string, unknown>): boolean {
    if (name === 'TodoWrite') {
      this.entries = recordsField(input, 'todos').map((todo, index) => ({
        id: String(index + 1),
        subject: stringField(todo, 'content'),
        activeForm: stringField(todo, 'activeForm'),
        state: toState(stringField(todo, 'status')),
      }))

      return true
    }

    if (name === 'TaskCreate') {
      this.awaitingId.set(toolUseId, {
        id: '',
        subject: stringField(input, 'subject'),
        activeForm: stringField(input, 'activeForm'),
        state: 'pending',
      })

      return false
    }

    if (name === 'TaskUpdate') return this.update(input)

    return false
  }

  /** Результат вызова: у TaskCreate в нём номер новой задачи. true - список изменился. */
  applyToolResult(toolUseId: string, structured: unknown, text: string): boolean {
    const created = this.awaitingId.get(toolUseId)

    if (!created) return false

    this.awaitingId.delete(toolUseId)

    const fromStructure = isRecord(structured)
      ? stringField(recordField(structured, 'task'), 'id')
      : ''
    const id = fromStructure || /Task #(\d+) created/.exec(text)?.[1] || ''

    if (!id) return false

    this.entries = [...this.entries.filter((entry) => entry.id !== id), { ...created, id }]

    return true
  }

  clear(): void {
    this.entries = []
    this.awaitingId.clear()
  }

  /** Вернуть список, каким он был (откат разговора к сообщению). */
  restore(entries: readonly TaskEntry[]): void {
    this.entries = [...entries]
    this.awaitingId.clear()
  }

  private update(input: Record<string, unknown>): boolean {
    const id = stringField(input, 'taskId')
    const status = stringField(input, 'status')

    if (!this.entries.some((entry) => entry.id === id)) return false

    if (status === 'deleted') {
      this.entries = this.entries.filter((entry) => entry.id !== id)

      return true
    }

    this.entries = this.entries.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            state: status ? toState(status) : entry.state,
            subject: stringField(input, 'subject') || entry.subject,
            activeForm: stringField(input, 'activeForm') || entry.activeForm,
          }
        : entry,
    )

    return true
  }
}
