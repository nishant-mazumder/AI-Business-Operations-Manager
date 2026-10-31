import { Store } from '@/types'

export const DEFAULT_STORE: Store = {
  id: 'main',
  name: 'Main Location',
  code: 'MAIN-01',
  location: 'Primary Hub',
  manager: 'Operations Lead',
  revenueShare: 1.0,
}

export const MOCK_STORES: Store[] = [
  DEFAULT_STORE,
]
