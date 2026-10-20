import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ProgressBar } from '@amazing-ide/ui/ProgressBar'
import { TextField } from '@amazing-ide/ui/TextField'

import { PROGRESS_SAMPLES } from '../ComponentsView.constants'
import { ShowcaseSection } from '../../ShowcaseSection/ShowcaseSection'
import { Specimen } from '../../Specimen/Specimen'
import { SearchListSpecimen } from './SearchListSpecimen'

/**
 * Раздел «Поля и прогресс»: поле с иконкой, поле с ошибкой, недоступное, список
 * поиска под полем, полосы прогресса.
 */
export const FieldsSection = () => {
  const { t } = useTranslation('showcase')
  const [query, setQuery] = useState('')
  const [branch, setBranch] = useState('main')

  return (
    <ShowcaseSection title={t('sections.fields')}>
      <Specimen label={t('specimens.textField')} layout="column">
        <TextField
          label={t('samples.search')}
          hideLabel
          icon={Search}
          placeholder={t('samples.searchPlaceholder')}
          value={query}
          onChange={setQuery}
        />
        <TextField
          label={t('samples.fieldLabel')}
          placeholder={t('samples.fieldPlaceholder')}
          value=""
          disabled
          onChange={() => undefined}
        />
      </Specimen>

      <Specimen label={t('specimens.textFieldError')} layout="column">
        <TextField
          label={t('samples.fieldLabel')}
          value={branch}
          error={t('samples.fieldError')}
          onChange={setBranch}
        />
      </Specimen>

      <SearchListSpecimen />

      <Specimen label={t('specimens.progress')} layout="column">
        {PROGRESS_SAMPLES.map(({ value, tone }) => (
          <ProgressBar key={value} value={value} tone={tone} label={t('samples.progressLabel')} />
        ))}
        <ProgressBar label={t('samples.progressLabel')} />
      </Specimen>
    </ShowcaseSection>
  )
}
