import type {
  AiSearchStep,
  SearchAnswer,
  AiSearchOutcome,
  SearchFindRequest,
} from '../claude-search'

/**
 * Часть контракта (contract.ts) про поиск по разговорам панели Claude Code: набранный
 * запрос по индексу, описанный - модели, и отмена её прогона. Отдельным файлом по
 * области, правила те же (.claude/rules/ipc-contract.md).
 */
export type ClaudeSearchInvokeContract = {
  /** Набранный запрос: находки области и счётчики обеих областей одним ответом. */
  'claudeSearch:find': { request: SearchFindRequest; response: SearchAnswer }
  /**
   * Описанный запрос - отдельному `claude -p` над разговорами текстом. runId выбирает окно:
   * по нему приходят шаги и по нему же отмена. Ответ - когда модель кончила (до пары минут).
   */
  'claudeSearch:ask': {
    request: { projectId: string; runId: string; query: string }
    response: AiSearchOutcome
  }
  /** Отменить прогон модели: процесс гасится, а если его ещё нет - он не стартует. */
  'claudeSearch:cancel': { request: { runId: string }; response: void }
}

export type ClaudeSearchEventContract = {
  /** Модель сделала шаг (искала слова, открыла разговор) - по ходу прогона runId. */
  'claudeSearch:step': AiSearchStep
}

/** Каналы этой части в рантайме: их разворачивает INVOKE_CHANNELS. */
export const CLAUDE_SEARCH_CHANNELS = {
  'claudeSearch:find': true,
  'claudeSearch:ask': true,
  'claudeSearch:cancel': true,
} satisfies Record<keyof ClaudeSearchInvokeContract, true>

/** События этой части: их разворачивает EVENT_CHANNELS. */
export const CLAUDE_SEARCH_EVENTS = {
  'claudeSearch:step': true,
} satisfies Record<keyof ClaudeSearchEventContract, true>
