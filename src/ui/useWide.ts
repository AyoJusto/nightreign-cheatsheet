import { useSyncExternalStore } from 'react'

const query = matchMedia('(min-width: 900px)')
export const useWide = () =>
  useSyncExternalStore((cb) => (query.addEventListener('change', cb), () => query.removeEventListener('change', cb)), () => query.matches)
