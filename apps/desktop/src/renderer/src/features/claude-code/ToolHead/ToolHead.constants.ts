import type { ParseKeys } from 'i18next'

import type { ToolChip } from '../tool-icons'

/** Подпись чипа вызова. */
export const CHIP_KEYS: Record<ToolChip, ParseKeys> = {
  READ: 'claudeCode.feed.chips.read',
  GREP: 'claudeCode.feed.chips.grep',
  EDIT: 'claudeCode.feed.chips.edit',
  WRITE: 'claudeCode.feed.chips.write',
  BASH: 'claudeCode.feed.chips.bash',
  WEB: 'claudeCode.feed.chips.web',
  MCP: 'claudeCode.feed.chips.mcp',
  SKILL: 'claudeCode.feed.chips.skill',
  TOOL: 'claudeCode.feed.chips.tool',
}
