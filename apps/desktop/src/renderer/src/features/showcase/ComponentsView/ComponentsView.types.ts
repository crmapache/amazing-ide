import type { ParseKeys } from 'i18next'

import type { AvatarTone } from '@amazing-ide/ui/Avatar.types'
import type { BadgeTone } from '@amazing-ide/ui/Badge.types'

export type SampleTabId = 'overview' | 'changes' | 'history'

export type AvatarSample = { tone: AvatarTone; initials: string }

export type BadgeSample = { tone: BadgeTone; labelKey: ParseKeys<'showcase'> }

export type FileSample = { name: string; folder: string }
