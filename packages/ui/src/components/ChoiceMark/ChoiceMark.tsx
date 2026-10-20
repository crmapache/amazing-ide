import clsx from 'clsx'
import { Check } from 'lucide-react'

import { CHOICE_CHECK_SIZE, CHOICE_CHECK_STROKE_WIDTH } from './ChoiceMark.constants'
import styles from './ChoiceMark.module.scss'
import type { ChoiceMarkProps } from './ChoiceMark.types'

/**
 * Отметка выбора: кружок для одного ответа, квадрат для нескольких или для пункта-дела.
 * Только знак - нажимать на неё нечего: выбирают строку, в которой она стоит
 * (MenuItem с selection), а в списке дел она просто показывает «сделано».
 */
export const ChoiceMark = ({ shape, checked, tone = 'info' }: ChoiceMarkProps) => (
  <span
    className={clsx(styles.choiceMark, styles[shape], styles[tone], checked && styles.checked)}
    aria-hidden>
    {checked && <Check size={CHOICE_CHECK_SIZE} strokeWidth={CHOICE_CHECK_STROKE_WIDTH} />}
  </span>
)
