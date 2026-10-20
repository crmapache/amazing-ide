import type { ParseKeys } from 'i18next'

import type { AvatarTone } from '@amazing-ide/ui/Avatar.types'
import type { BadgeTone } from '@amazing-ide/ui/Badge.types'
import type { ProgressBarTone } from '@amazing-ide/ui/ProgressBar.types'
import type { RingMeterTone } from '@amazing-ide/ui/RingMeter.types'

export type SampleTabId = 'overview' | 'changes' | 'history'

export type AvatarSample = { tone: AvatarTone; initials: string }

export type BadgeSample = { tone: BadgeTone; labelKey: ParseKeys<'showcase'> }

export type FileSample = { name: string; folder: string }

export type ProgressSample = { value: number; tone: ProgressBarTone }

export type RingSample = {
  key: string
  value: number
  pace: number | null
  tone: RingMeterTone
  burning: boolean
}
