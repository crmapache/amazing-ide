import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'
import { MenuSeparator } from '@amazing-ide/ui/MenuSeparator'
import { Popover } from '@amazing-ide/ui/Popover'
import { useAnchoredPopover } from '@amazing-ide/ui/Popover.hooks'

import { EDITOR_MENU, MENU_SOURCE } from './EditorContextMenu.constants'
import styles from './EditorContextMenu.module.scss'
import type { EditorContextMenuProps } from './EditorContextMenu.types'

/**
 * Меню правой кнопки в коде - нашим меню, как у вкладок, а не меню Monaco: то рисуется в
 * теневом DOM внутри панели редактора, куда не доходят цвета темы, и край панели его
 * обрезает. Встаёт у курсора мыши, пункт выполняет ту же команду Monaco, что и сочетание.
 */
export const EditorContextMenu = ({ editorRef, at, readOnly, onClose }: EditorContextMenuProps) => {
  const { t } = useTranslation()
  // Якорь - точка нажатия. Стоит всегда, а не появляется с точкой: иначе панель открылась бы
  // на рендер позже меню, и меню не поставило бы фокус на первый пункт.
  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null)
  const { id, ref, onToggle } = useAnchoredPopover(at ? anchor : null, onClose)

  // Пункт сначала закрывает меню, и фокус возвращается в код: буфер обмена и правка всех
  // вхождений работают только у редактора с фокусом.
  const handleRun = (command: string) => editorRef.current?.trigger(MENU_SOURCE, command, null)

  return (
    <>
      <span
        ref={setAnchor}
        className={styles.anchor}
        // eslint-disable-next-line no-restricted-syntax -- точка нажатия известна только в рантайме
        style={at ? { left: at.x, top: at.y } : undefined}
      />
      <Popover id={id} ref={ref} onToggle={onToggle}>
        {at && (
          <Menu label={t('editor.contextMenu.label')} autoFocus>
            {EDITOR_MENU.map((group, index) => (
              <Fragment key={group[0]?.name}>
                {index > 0 && <MenuSeparator />}
                {group.map((entry) => (
                  <MenuItem
                    key={entry.name}
                    icon={entry.icon}
                    label={t(`editor.contextMenu.${entry.name}`)}
                    hint={entry.keys}
                    disabled={readOnly && entry.edits}
                    onSelect={() => handleRun(entry.command)}
                  />
                ))}
              </Fragment>
            ))}
          </Menu>
        )}
      </Popover>
    </>
  )
}
