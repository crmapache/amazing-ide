import { FilePlus, FolderOpen, MoreHorizontal, MousePointerClick } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@amazing-ide/ui/Avatar'
import { Badge } from '@amazing-ide/ui/Badge'
import { Card } from '@amazing-ide/ui/Card'
import { EmptyState } from '@amazing-ide/ui/EmptyState'
import { IconButton } from '@amazing-ide/ui/IconButton'
import { Kbd } from '@amazing-ide/ui/Kbd'
import { Menu } from '@amazing-ide/ui/Menu'
import { MenuItem } from '@amazing-ide/ui/MenuItem'
import { MenuSection } from '@amazing-ide/ui/MenuSection'
import { MenuSeparator } from '@amazing-ide/ui/MenuSeparator'

import { KBD_SAMPLES } from '../ComponentsView.constants'
import styles from '../ComponentsView.module.scss'
import { ShowcaseSection } from '../../ShowcaseSection/ShowcaseSection'
import { Specimen } from '../../Specimen/Specimen'

/** Раздел «Поверхности»: карточка, пустое состояние и меню вне всплывающей панели. */
export const SurfacesSection = () => {
  const { t } = useTranslation('showcase')

  return (
    <ShowcaseSection title={t('sections.surfaces')}>
      <Specimen label={t('specimens.card')} layout="column">
        <Card
          title={t('samples.cardTitle')}
          description={t('samples.cardDescription')}
          actions={<IconButton icon={MoreHorizontal} size="sm" label={t('samples.more')} />}>
          {t('samples.cardBody')}
          <div className={styles.cardBadges}>
            <Badge tone="success">{t('samples.active')}</Badge>
            <Badge tone="accent">{t('samples.ahead')}</Badge>
            <Kbd keys={KBD_SAMPLES[0] ?? []} />
          </div>
        </Card>
        <Card size="sm" title={t('samples.cardCompactTitle')}>
          {t('samples.cardCompactBody')}
        </Card>
      </Specimen>

      <Specimen label={t('specimens.emptyState')} layout="column">
        <div className={styles.emptyBox}>
          <EmptyState
            icon={MousePointerClick}
            title={t('samples.emptyTitle')}
            description={t('samples.emptyText')}
          />
        </div>
      </Specimen>

      <Specimen label={t('specimens.menu')} layout="column">
        <div className={styles.menuBox}>
          <Menu label={t('samples.menuLabel')}>
            <MenuItem icon={FilePlus} label={t('samples.newFile')} onSelect={() => undefined} />
            <MenuItem
              icon={FolderOpen}
              label={t('samples.openFile')}
              hint={t('samples.notBuilt')}
              disabled
              onSelect={() => undefined}
            />
            <MenuSeparator />
            <MenuSection title={t('samples.menuSection')}>
              <MenuItem
                leading={<Avatar initials="AI" tone={0} />}
                label={t('samples.currentItem')}
                description={t('samples.currentPath')}
                current
                onSelect={() => undefined}
              />
              <MenuItem
                leading={<Avatar initials="RR" tone={1} />}
                label={t('samples.otherItem')}
                description={t('samples.otherPath')}
                onSelect={() => undefined}
              />
            </MenuSection>
          </Menu>
        </div>
      </Specimen>
    </ShowcaseSection>
  )
}
