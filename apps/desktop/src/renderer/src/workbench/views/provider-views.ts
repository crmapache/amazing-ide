import { lazy } from 'react'
import { Sparkles } from 'lucide-react'

import type { ProviderViewId } from '../../state/layout.types'
import type { ViewDescriptor } from './views.types'

/**
 * GUI провайдеров LLM для правой панели (зона 7) в порядке иконок зоны 3. GUI
 * провайдера тяжёлый, поэтому грузится только при первом показе. Новый провайдер:
 * id в ProviderViewId, фича в features/, запись здесь (docs/architecture.md).
 */
export const PROVIDER_VIEWS: readonly ViewDescriptor<ProviderViewId>[] = [
  {
    id: 'claude-code',
    icon: Sparkles,
    labelKey: 'providerViews.claudeCode',
    Component: lazy(() =>
      import('../../features/claude-code/ClaudeCodeView/ClaudeCodeView').then((module) => ({
        default: module.ClaudeCodeView,
      })),
    ),
  },
]
