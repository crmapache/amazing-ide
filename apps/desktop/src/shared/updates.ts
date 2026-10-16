/**
 * Почему новую версию нельзя поставить из самого приложения, и человеку остаётся
 * скачать её руками со страницы релизов.
 */
export type ManualUpdateReason =
  /** Запущено не собранное приложение, а dev-режим. */
  | 'development'
  /** Приложение запущено из образа dmg или из карантинной копии macOS, а не из папки. */
  | 'not-installed'
  /** Нет прав писать в папку, где лежит приложение. */
  | 'read-only-location'
  /** Сборка подписана ad-hoc, без сертификата: проверить подпись новой версии не по чему. */
  | 'unsigned-build'

/** Почему новая версия не встала. Подробности - в журнале главного процесса. */
export type UpdateFailureReason =
  /** Не скачалась: нет сети, сервер ответил ошибкой, оборвалось по таймауту. */
  | 'download'
  /** Скачалась не та: размер, контрольная сумма или версия внутри не совпали с манифестом. */
  | 'integrity'
  /** Подписана не нашим сертификатом - возможна подмена релиза. */
  | 'signature'
  /** Не распаковалась или не встала на место установленной. */
  | 'install'

/**
 * Состояние обновления. Ведёт его главный процесс; окно только показывает и
 * отправляет действия (поставить, отложить).
 */
export type UpdateStatus =
  | { kind: 'idle' }
  | {
      kind: 'available'
      version: string
      notes: string
      /** Поставить можно из приложения. Иначе - только скачать руками. */
      install: { mode: 'automatic' } | { mode: 'manual'; reason: ManualUpdateReason }
    }
  | { kind: 'downloading'; version: string; progress: number }
  | { kind: 'installing'; version: string }
  | { kind: 'failed'; version: string; reason: UpdateFailureReason }
