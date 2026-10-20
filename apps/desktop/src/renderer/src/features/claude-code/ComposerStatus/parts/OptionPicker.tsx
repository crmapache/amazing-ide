import clsx from 'clsx'

import { DropdownButton } from '@amazing-ide/ui/DropdownButton'
import { Menu } from '@amazing-ide/ui/Menu'
import { Popover } from '@amazing-ide/ui/Popover'
import { usePopover } from '@amazing-ide/ui/Popover.hooks'
import { Tooltip } from '@amazing-ide/ui/Tooltip'

import styles from '../ComposerStatus.module.scss'
import type { OptionPickerProps } from '../ComposerStatus.types'

/**
 * Селектор строки под полем, как в ACC: «MODEL Opus 5.5 ⌄» - подпись капсом и значение,
 * по нажатию - меню. Модель, усилие и режим отличаются только пунктами; меню строится,
 * только пока открыто.
 */
export const OptionPicker = ({
  caption,
  label,
  tone,
  mark,
  hint,
  menuLabel,
  children,
}: OptionPickerProps) => {
  const popover = usePopover()

  return (
    <>
      <Tooltip label={hint} placement="top">
        <DropdownButton
          {...popover.triggerProps}
          size="sm"
          label={label}
          leading={
            <>
              <span className={clsx(styles.caption, tone && styles[tone])}>{caption}</span>
              {mark}
            </>
          }
          menuLabel={menuLabel}
        />
      </Tooltip>
      <Popover {...popover.popoverProps}>
        {popover.isOpen && (
          <Menu label={menuLabel} autoFocus>
            {children}
          </Menu>
        )}
      </Popover>
    </>
  )
}
