import { useState } from 'react'
import { FilePlus, FolderOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@amazing-ide/ui/Button'
import { Dialog } from '@amazing-ide/ui/Dialog'
import { DropdownButton } from '@amazing-ide/ui/DropdownButton'
import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'
import { Popover } from '@amazing-ide/ui/Popover'
import { usePopover } from '@amazing-ide/ui/Popover.hooks'
import { TextField } from '@amazing-ide/ui/TextField'
import { Toast } from '@amazing-ide/ui/Toast'

import styles from '../ComponentsView.module.scss'
import { ShowcaseSection } from '../../ShowcaseSection/ShowcaseSection'
import { Specimen } from '../../Specimen/Specimen'

/**
 * Раздел «Оверлеи»: уведомления трёх видов, живая всплывающая панель с меню и
 * модальный диалог. Всё настоящее - открывается, закрывается по Esc и клику мимо.
 */
export const OverlaysSection = () => {
  const { t } = useTranslation('showcase')
  const popover = usePopover()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [branch, setBranch] = useState('')

  const closeDialog = () => setIsDialogOpen(false)

  const laterButton = (
    <Button variant="ghost" size="sm">
      {t('samples.later')}
    </Button>
  )

  return (
    <ShowcaseSection title={t('sections.overlays')}>
      <Specimen label={t('specimens.toast')} layout="column">
        <div className={styles.stack}>
          <Toast
            title={t('samples.toastTitle')}
            description={t('samples.toastText')}
            actions={
              <>
                <Button variant="primary" size="sm">
                  {t('samples.update')}
                </Button>
                {laterButton}
              </>
            }
          />
          <Toast
            tone="danger"
            title={t('samples.toastDangerTitle')}
            description={t('samples.toastDangerText')}
          />
          <Toast
            title={t('samples.toastProgressTitle')}
            description={t('samples.toastProgressText')}
            progress={0.64}
          />
        </div>
      </Specimen>

      <Specimen label={t('specimens.popover')}>
        <DropdownButton
          {...popover.triggerProps}
          label={t('samples.openPopover')}
          menuLabel={t('samples.menuLabel')}
        />
        <Popover {...popover.popoverProps}>
          {popover.isOpen && (
            <Menu label={t('samples.menuLabel')} autoFocus>
              <MenuItem icon={FilePlus} label={t('samples.newFile')} onSelect={() => undefined} />
              <MenuItem
                icon={FolderOpen}
                label={t('samples.openFile')}
                onSelect={() => undefined}
              />
            </Menu>
          )}
        </Popover>
      </Specimen>

      <Specimen label={t('specimens.dialog')}>
        <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>
          {t('samples.openDialog')}
        </Button>
        <Dialog
          open={isDialogOpen}
          title={t('samples.dialogTitle')}
          actions={
            <>
              <Button variant="ghost" onClick={closeDialog}>
                {t('samples.cancel')}
              </Button>
              <Button variant="primary" type="submit">
                {t('samples.create')}
              </Button>
            </>
          }
          onSubmit={closeDialog}
          onClose={closeDialog}>
          <TextField
            label={t('samples.fieldLabel')}
            placeholder={t('samples.fieldPlaceholder')}
            value={branch}
            autoFocus
            onChange={setBranch}
          />
        </Dialog>
      </Specimen>
    </ShowcaseSection>
  )
}
