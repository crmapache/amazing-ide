import { Bug, BookOpen, GitCompare, FlaskConical } from 'lucide-react'

import type { WelcomeSuggestion } from './Welcome.types'

/** С чего обычно начинают разговор о проекте. */
export const SUGGESTIONS: readonly WelcomeSuggestion[] = [
  { icon: BookOpen, textKey: 'claudeCode.welcome.suggestions.explain' },
  { icon: Bug, textKey: 'claudeCode.welcome.suggestions.bug' },
  { icon: GitCompare, textKey: 'claudeCode.welcome.suggestions.review' },
  { icon: FlaskConical, textKey: 'claudeCode.welcome.suggestions.tests' },
]
