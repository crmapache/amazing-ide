import { it, expect, describe } from 'vitest'

import { mergeCommands, builtinsFromReply, commandsFromChange } from './cli-replies'

const compact = {
  name: 'compact',
  description: 'Free up context by summarizing the conversation so far',
  argumentHint: '<optional custom summarization instructions>',
  builtin: true,
}

describe('команды от CLI', () => {
  it('полный список заменяет прежний и помнит свои команды CLI', () => {
    const commands = commandsFromChange({
      type: 'system',
      subtype: 'commands_changed',
      commands: [compact, { name: 'review', description: 'Review', argumentHint: '' }],
    })

    expect(commands).toEqual([compact, { name: 'review', description: 'Review', argumentHint: '' }])
  })

  it('ответ без поля commands - «новостей нет», а не пустой список', () => {
    expect(commandsFromChange({ type: '', plugins: [] })).toBeNull()
    expect(commandsFromChange({ type: '', commands: [] })).toEqual([])
  })

  it('из ответа на initialize - только свои команды CLI', () => {
    const reply = {
      commands: [compact, { name: 'my-skill', description: 'Skill', argumentHint: '' }],
      models: [],
    }

    expect(builtinsFromReply(reply)).toEqual([compact])
    expect(builtinsFromReply(null)).toEqual([])
  })

  it('имена из init берут пояснение из известного - и признак своей команды', () => {
    const merged = mergeCommands(
      [compact],
      [
        { name: 'compact', description: '', argumentHint: '' },
        { name: 'fresh', description: '', argumentHint: '' },
      ],
    )

    expect(merged).toEqual([compact, { name: 'fresh', description: '', argumentHint: '' }])
  })
})
