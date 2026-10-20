import { useRef, useState, useEffect, useCallback } from 'react'
import type { ToggleEvent } from 'react'

import { usePopover } from '@amazing-ide/ui/Popover.hooks'

import { useOpenFileAction } from '../../../state/open-file.context'
import type { OpenFileRequest } from '../../../state/open-file.context'

/**
 * Нажатие на путь и его исход: «нет такого» помечает ссылку (следующее нажатие
 * спрашивает диск снова - файл мог вернуться), несколько одноимённых - меню выбора под
 * ссылкой. Меню открывается не нажатием, а ответом главного процесса, поэтому панель
 * показывается из кода с ссылкой-якорем и живёт, только пока открыта.
 */
export const usePathOpening = (request: OpenFileRequest) => {
  const openFile = useOpenFileAction()
  const popover = usePopover()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [isMissing, setIsMissing] = useState(false)
  const [candidates, setCandidates] = useState<string[] | null>(null)
  const { ref: popoverRef, onToggle } = popover.popoverProps

  // Панель выбора смонтировалась - показать её у ссылки.
  useEffect(() => {
    const anchor = anchorRef.current

    if (candidates && anchor) popoverRef.current?.showPopover({ source: anchor })
  }, [candidates, popoverRef])

  const open = useCallback(
    async (target: OpenFileRequest) => {
      if (!openFile) return

      const outcome = await openFile(target)

      setIsMissing(outcome.kind === 'missing')
      setCandidates(outcome.kind === 'choose' ? outcome.candidates : null)
    },
    [openFile],
  )

  const handleToggle = (event: ToggleEvent<HTMLDivElement>) => {
    onToggle(event)
    if (event.newState === 'closed') setCandidates(null)
  }

  return {
    canOpen: openFile !== null,
    isMissing,
    candidates,
    anchorRef,
    popoverProps: { ...popover.popoverProps, onToggle: handleToggle },
    open: () => open(request),
    // Место (строка, find) едет и с выбранным файлом: оно про файл, а не про имя.
    choose: (relativePath: string) => open({ ...request, path: relativePath }),
  }
}
