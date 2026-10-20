import { useTranslation } from 'react-i18next'

import type { EarlierMarkerProps } from '../Feed.types'
import { CheckpointRow } from '../../NoticeRow/parts/CheckpointRow'

/**
 * Метка над лентой, как в ACC: выше в транскрипте есть ещё - нажатие приносит страницу
 * ранних сообщений, читаемое при этом не сдвигается.
 */
export const EarlierMarker = ({ onLoad, isLoading }: EarlierMarkerProps) => {
  const { t } = useTranslation()

  return (
    <CheckpointRow
      chip={t('claudeCode.notice.chips.earlier')}
      onClick={isLoading ? undefined : onLoad}>
      {t('claudeCode.feed.loadEarlier')}
    </CheckpointRow>
  )
}
