import { it, expect, describe } from 'vitest'

import { fleetOf } from './workflow-fleet'

const agent = (over: Record<string, unknown>) => ({
  type: 'workflow_agent',
  index: 1,
  label: 'review:bugs',
  phaseIndex: 1,
  phaseTitle: 'Review',
  state: 'start',
  ...over,
})

const agentsOf = (progress: unknown[]) => fleetOf(progress)?.phases.flatMap((phase) => phase.agents)

describe('fleetOf', () => {
  it('без отчёта флота нет - вызов Workflow рисуется обычной карточкой', () => {
    expect(fleetOf(undefined)).toBeNull()
    expect(fleetOf([])).toBeNull()
    expect(fleetOf('nope')).toBeNull()
  })

  it('раскладывает агентов по их фазам в порядке появления', () => {
    const fleet = fleetOf([
      { type: 'workflow_phase', index: 1, title: 'Review' },
      { type: 'workflow_phase', index: 2, title: 'Verify' },
      agent({ index: 1, startedAt: 10 }),
      agent({ index: 2, label: 'verify:one', phaseIndex: 2, state: 'done', durationMs: 4200 }),
    ])

    expect(
      fleet?.phases.map((phase) => [phase.title, phase.agents.map((one) => one.label)]),
    ).toEqual([
      ['Review', ['review:bugs']],
      ['Verify', ['verify:one']],
    ])
  })

  it('отличает ждущего в очереди от работающего: флот сверх потолка в основном ждёт', () => {
    const fleet = fleetOf([agent({ index: 1, startedAt: 10 }), agent({ index: 2 })])

    expect(fleet?.phases[0]?.agents.map((one) => one.state)).toEqual(['running', 'queued'])
    expect(fleet?.running).toBe(1)
  })

  it('считает работающих, готовых, упавших и всех', () => {
    const fleet = fleetOf([
      agent({ index: 1, startedAt: 10 }),
      agent({ index: 2, state: 'done' }),
      agent({ index: 3, state: 'done' }),
      agent({ index: 4, state: 'error', error: 'boom' }),
      agent({ index: 5 }),
    ])

    expect(fleet).toMatchObject({ running: 1, done: 2, failed: 1, total: 5 })
  })

  it('снятый рукой агент - не упавший', () => {
    const fleet = fleetOf([agent({ state: 'error', skipped: true, error: 'user-skip' })])

    expect(fleet?.phases[0]?.agents[0]?.state).toBe('skipped')
    expect(fleet?.failed).toBe(0)
  })

  it('держит, во что обошёлся агент и как его гоняли', () => {
    const [first] = agentsOf([
      agent({
        state: 'done',
        model: 'claude-opus-5',
        agentId: 'a1b2',
        durationMs: 8100,
        tokens: 30_308,
        toolCalls: 4,
        attempt: 2,
        cached: true,
        promptPreview: 'Find bugs',
        resultPreview: '{"findings":',
      }),
    ]) ?? [undefined]

    expect(first).toMatchObject({
      model: 'claude-opus-5',
      agentId: 'a1b2',
      durationMs: 8100,
      tokens: 30_308,
      toolCalls: 4,
      attempt: 2,
      cached: true,
      prompt: 'Find bugs',
      result: '{"findings":',
    })
  })

  it('первую попытку не помечает: она есть у каждого', () => {
    expect(agentsOf([agent({ attempt: 1 })])?.[0]?.attempt).toBe(0)
  })

  it('без подписи агент назван заданием, без задания - номером', () => {
    expect(
      agentsOf([agent({ label: undefined, promptPreview: 'Find readFile' })])?.[0]?.label,
    ).toBe('Find readFile')
    expect(agentsOf([agent({ index: 7, label: undefined })])?.[0]?.label).toBe('#7')
  })

  it('агентов вне phase() собирает в безымянную группу', () => {
    const fleet = fleetOf([
      { type: 'workflow_phase', index: 1, title: 'Review' },
      agent({ index: 1 }),
      agent({ index: 2, phaseIndex: undefined, label: 'loose' }),
    ])

    expect(fleet?.phases.map((phase) => [phase.index, phase.title])).toEqual([
      [1, 'Review'],
      [null, ''],
    ])
  })

  it('строки log() скрипта - в порядке печати', () => {
    const fleet = fleetOf([
      { type: 'workflow_log', message: '12 of 40 found' },
      agent({}),
      { type: 'workflow_log', message: '31 of 40 found' },
    ])

    expect(fleet?.log).toEqual(['12 of 40 found', '31 of 40 found'])
  })
})
