import { QueryClientProvider } from '@tanstack/react-query'

import { queryClient } from '../query-client'
import { MainProcessSync } from '../MainProcessSync/MainProcessSync'
import { Workbench } from '../../workbench/Workbench/Workbench'

/** Корень окна: провайдеры, синхронизация с главным процессом и рабочая область. */
export const App = () => (
  <QueryClientProvider client={queryClient}>
    <MainProcessSync />
    <Workbench />
  </QueryClientProvider>
)
