import '@amazing-ide/ui/tokens.css'
import '@amazing-ide/ui/base.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { installTextSize } from '../state/text-size.store'
import { App } from './App/App'

import './i18n'

const root = document.getElementById('root')

if (!root) throw new Error('Нет #root в index.html')

// До первой отрисовки: окно сразу встаёт выбранным размером текста, без скачка.
installTextSize()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
