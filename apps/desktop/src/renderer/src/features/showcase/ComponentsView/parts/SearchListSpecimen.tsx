import { useState } from 'react'
import { Search, FileCode } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ListBox } from '@amazing-ide/ui/ListBox'
import { useListBox } from '@amazing-ide/ui/ListBox.hooks'
import { ListBoxOption } from '@amazing-ide/ui/ListBoxOption'
import { TextField } from '@amazing-ide/ui/TextField'

import { FILE_SAMPLES } from '../ComponentsView.constants'
import { Specimen } from '../../Specimen/Specimen'

/**
 * Образец списка поиска: поле и ListBox под ним. Живой - печатаешь, список
 * фильтруется, стрелки двигают выделение, а фокус остаётся в поле.
 */
export const SearchListSpecimen = () => {
  const { t } = useTranslation('showcase')
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState('')
  const needle = query.trim().toLowerCase()
  const files = FILE_SAMPLES.filter((file) => file.name.toLowerCase().includes(needle))
  const list = useListBox(files.length, needle)

  const handlePick = (index: number) => setPicked(files[index]?.name ?? '')

  return (
    <Specimen label={t('specimens.listBox')} layout="column">
      <TextField
        {...list.comboboxProps}
        label={t('samples.listBoxLabel')}
        hideLabel
        icon={Search}
        placeholder={t('samples.listBoxPlaceholder')}
        value={query}
        onChange={setQuery}
        onKeyDown={(event) => list.handleKeyDown(event, handlePick)}
      />
      {files.length > 0 && (
        <ListBox {...list.listBoxProps} label={t('samples.listBoxLabel')}>
          {files.map((file, index) => (
            <ListBoxOption
              key={file.name}
              id={list.optionId(index)}
              icon={FileCode}
              label={file.name}
              highlight={
                needle
                  ? [{ start: file.name.toLowerCase().indexOf(needle), length: needle.length }]
                  : []
              }
              description={file.folder}
              hint={file.name === picked ? '↵' : undefined}
              active={index === list.activeIndex}
              onSelect={() => setPicked(file.name)}
              onActivate={() => list.setActiveIndex(index)}
            />
          ))}
        </ListBox>
      )}
      {files.length === 0 && t('samples.listBoxEmpty')}
    </Specimen>
  )
}
