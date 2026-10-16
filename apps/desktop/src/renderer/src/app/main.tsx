import '@amazing-ide/ui/tokens.css'
import '@amazing-ide/ui/base.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App/App'

import './i18n'

const root = document.getElementById('root')

if (!root) throw new Error('Нет #root в index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
