export type LightboxProps = {
  open: boolean
  /** Картинка (URL или data URL). null - ещё грузится: вместо неё loadingLabel. */
  src: string | null
  /** Что на картинке - для скринридера и пока она не загрузилась. */
  alt: string
  loadingLabel: string
  /**
   * Картинку не получить (файла нет, сообщение её больше не держит): этот текст встаёт
   * на её место вместо loadingLabel - вечное «грузится» читалось бы поломкой.
   */
  error?: string | undefined
  closeLabel: string
  onClose: () => void
}
