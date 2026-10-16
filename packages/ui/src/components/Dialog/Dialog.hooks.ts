import { useRef, useEffect } from 'react'

/**
 * Открывает и закрывает нативный <dialog> вслед за open. showModal даёт верхний
 * слой, затемнение и недоступность остального окна, Esc закрывает сам браузер.
 */
export const useModalDialog = (open: boolean) => {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current

    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return ref
}
