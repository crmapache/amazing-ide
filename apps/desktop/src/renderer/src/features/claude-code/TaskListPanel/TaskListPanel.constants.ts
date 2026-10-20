import type { LucideIcon } from 'lucide-react'
import { Circle, CircleCheck, LoaderCircle } from 'lucide-react'

import type { TaskState } from '@shared/claude-feed'

/** Значок задачи по её состоянию. */
export const STATE_ICON: Record<TaskState, LucideIcon> = {
  pending: Circle,
  in_progress: LoaderCircle,
  completed: CircleCheck,
}

/** Класс строки по состоянию: имена классов CSS Modules - camelCase. */
export const STATE_CLASS: Record<TaskState, string> = {
  pending: 'pending',
  in_progress: 'inProgress',
  completed: 'completed',
}
