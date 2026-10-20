/** circle - один ответ из многих; square - сколько угодно (и пункт-дело в списке). */
export type ChoiceMarkShape = 'circle' | 'square'

/** info - выбор человека (справка, которую он дал); success - сделанный пункт. */
export type ChoiceMarkTone = 'info' | 'success'

export type ChoiceMarkProps = {
  shape: ChoiceMarkShape
  checked: boolean
  tone?: ChoiceMarkTone | undefined
}
