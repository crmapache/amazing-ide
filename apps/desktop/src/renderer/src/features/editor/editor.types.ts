import type { FileFailure } from '@shared/fs'

/**
 * Что держит файл открытым с несохранённым: файл поменял кто-то ещё, пока здесь
 * правили (conflict); файл удалили (deleted); запись не прошла (saveFailed); файл - ссылка
 * за пределы проекта, и правка в нём пишется только по просьбе (outside). Пока вопрос не
 * решён, автосохранение молчит, а вкладка не закрывается молча.
 */
export type DocumentNotice =
  | { kind: 'conflict' }
  | { kind: 'deleted' }
  | { kind: 'saveFailed'; reason: FileFailure }
  | { kind: 'outside' }

/**
 * Что показывает вкладка: файл ещё читается, текст (только для чтения или с вопросом),
 * не текст, слишком большой или не прочитался (нет прав, проект закрыли, диск отвалился).
 */
export type DocumentStatus =
  | { kind: 'loading' }
  | { kind: 'text'; readOnly: boolean; notice: DocumentNotice | null }
  | { kind: 'binary' }
  | { kind: 'tooLarge'; size: number; limit: number }
  | { kind: 'unreadable'; reason: FileFailure }

/**
 * Как показан файл Markdown, как в WebStorm: только код (editor), код и просмотр рядом
 * (split), только просмотр (preview). У других файлов - всегда код.
 */
export type MarkdownLayout = 'editor' | 'split' | 'preview'
