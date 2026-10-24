import { useSyncExternalStore } from 'react'

const createMediaHook = (q: string) => {
  const query = matchMedia(q)
  const subscribe = (cb: () => void) => (query.addEventListener('change', cb), () => query.removeEventListener('change', cb))
  const matches = () => query.matches
  return () => useSyncExternalStore(subscribe, matches)
}

// The CSS @media rules repeat this 900px; keep them in step.
export const useWide = createMediaHook('(min-width: 900px)')
export const useFinePointer = createMediaHook('(pointer: fine)')
