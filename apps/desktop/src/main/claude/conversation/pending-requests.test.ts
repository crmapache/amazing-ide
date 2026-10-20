import { it, expect, describe } from 'vitest'

import type { ControlRequest } from '../cli/cli-messages'
import {
  answerFor,
  holdRequest,
  answerInChat,
  KEEP_PLANNING,
  modeFromAlways,
} from './pending-requests'

const canUseTool = (request: Record<string, unknown>): ControlRequest => ({
  type: 'control_request',
  request_id: 'r1',
  request: { subtype: 'can_use_tool', tool_use_id: 't1', ...request },
})

const writeRequest = canUseTool({
  tool_name: 'Write',
  input: { file_path: '/p/b.txt', content: 'hi' },
  description: 'b.txt',
  permission_suggestions: [{ type: 'setMode', mode: 'acceptEdits', destination: 'session' }],
})

describe('вопросы CLI', () => {
  it('разрешение: вход возвращается как был, «всегда» - предложенный режим', () => {
    const held = holdRequest(writeRequest)

    expect(held?.pending).toMatchObject({
      kind: 'permission',
      toolName: 'Write',
      alwaysKind: 'mode',
    })
    expect(
      held && answerFor(held, { kind: 'permission', decision: { behavior: 'allow' } }),
    ).toEqual({
      behavior: 'allow',
      updatedInput: { file_path: '/p/b.txt', content: 'hi' },
    })
    expect(held && modeFromAlways(held)).toBe('acceptEdits')
  })

  it('«всегда» без предложений CLI - правило на инструмент', () => {
    const held = holdRequest(canUseTool({ tool_name: 'mcp__x__y', input: {} }))
    const answer =
      held && answerFor(held, { kind: 'permission', decision: { behavior: 'allowAlways' } })

    expect(answer?.['updatedPermissions']).toEqual([
      {
        type: 'addRules',
        rules: [{ toolName: 'mcp__x__y' }],
        behavior: 'allow',
        destination: 'localSettings',
      },
    ])
  })

  it('выбор в AskUserQuestion уходит ответами во входе вызова', () => {
    const held = holdRequest(
      canUseTool({
        tool_name: 'AskUserQuestion',
        input: {
          questions: [
            { question: 'Which?', header: 'Pick', options: [{ label: 'A', description: '' }] },
          ],
        },
      }),
    )

    expect(held?.pending.kind).toBe('question')
    expect(held && answerFor(held, { kind: 'question', answers: { 'Which?': 'A' } })).toMatchObject(
      {
        behavior: 'allow',
        updatedInput: { answers: { 'Which?': 'A' } },
      },
    )
  })

  it('план: «доработать» без текста - замечание по умолчанию', () => {
    const held = holdRequest(canUseTool({ tool_name: 'ExitPlanMode', input: { plan: '# Plan' } }))
    const answer =
      held && answerFor(held, { kind: 'plan', approved: false, acceptEdits: false, feedback: '' })

    expect(answer).toEqual({ behavior: 'deny', message: KEEP_PLANNING })
  })

  it('текст в чат при плане - это замечание к плану', () => {
    const held = holdRequest(canUseTool({ tool_name: 'ExitPlanMode', input: { plan: 'x' } }))

    expect(held && answerInChat(held, 'add tests')).toEqual({
      behavior: 'deny',
      message: 'add tests',
    })
  })

  it('вопрос без id вызова не к чему привязать', () => {
    expect(
      holdRequest({ type: 'control_request', request_id: 'r', request: { tool_name: 'Bash' } }),
    ).toBeNull()
  })
})
