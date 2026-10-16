export type ResizeHandleEdge = 'start' | 'end'

export type ResizeHandleProps = {
  /** У какого края родителя стоит ручка. Родитель должен быть position: relative. */
  edge: ResizeHandleEdge
  /** Подпись для скринридера: что именно меняет размер. */
  label: string
  /** Сдвиг указателя по горизонтали с прошлого вызова, в пикселях. */
  onResize: (deltaX: number) => void
}
