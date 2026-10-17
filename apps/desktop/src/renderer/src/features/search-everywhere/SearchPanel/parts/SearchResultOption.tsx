import { File } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ListBoxOption } from '@amazing-ide/ui/ListBoxOption'

import type { SearchResultOptionProps } from '../SearchPanel.types'
import { splitPath } from '../../../../lib/path.utils'

/**
 * Строка результата поиска. Файл - имя и папка серым, действие - подпись и сочетание
 * справа, найденный текст - строка кода и «файл:строка» справа.
 */
export const SearchResultOption = ({ result, ...option }: SearchResultOptionProps) => {
  const { t } = useTranslation()

  if (result.kind === 'file') {
    return (
      <ListBoxOption
        {...option}
        icon={File}
        label={result.file.name}
        highlight={result.match.ranges}
        description={result.file.folder}
      />
    )
  }

  if (result.kind === 'action') {
    return (
      <ListBoxOption
        {...option}
        icon={result.action.icon}
        label={result.action.label}
        highlight={result.match.ranges}
        hint={result.action.shortcut}
      />
    )
  }

  const { relativePath, line, preview, matchStart, matchLength } = result.match

  return (
    <ListBoxOption
      {...option}
      code
      label={preview}
      highlight={[{ start: matchStart, length: matchLength }]}
      hint={t('searchEverywhere.lineHint', { name: splitPath(relativePath).name, line })}
    />
  )
}
