/** Номер цвета значка: --color-avatar-0 ... --color-avatar-5. */
export type AvatarTone = 0 | 1 | 2 | 3 | 4 | 5

export type AvatarProps = {
  /** Одна-две буквы. Считает их тот, кто знает, чей это значок. */
  initials: string
  tone: AvatarTone
}
