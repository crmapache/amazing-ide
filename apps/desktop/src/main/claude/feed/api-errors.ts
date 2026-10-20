/** Параметры выборки, которые модели новее Opus 4.6 отвергают, - именами полей API. */
const SAMPLING_PARAMS = ['temperature', 'top_p', 'top_k']

/**
 * Запрос отвергнут из-за параметра выборки (как в ACC): код 400 из машинного поля CLI
 * (`api_error_status`) и имя поля в тексте. Ход Claude Code таких параметров не несёт -
 * значит, их добавил по дороге шлюз или прокси из настроек. Ищутся имена полей, а не
 * формулировка отказа: они одни и те же в любой обёртке шлюза.
 */
export const overSampling = (status: number, message: string): boolean => {
  if (status !== 400) return false

  const said = message.toLowerCase()

  return SAMPLING_PARAMS.some((name) => said.includes(name))
}
