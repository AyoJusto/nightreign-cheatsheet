import { useSyncExternalStore } from 'react'

// Made once per query: a new subscribe on each render would make React resubscribe.
const media = (q: string) => {
  const query = matchMedia(q)
  const subscribe = (cb: () => void) => (query.addEventListener('change', cb), () => query.removeEventListener('change', cb))
  const matches = () => query.matches
  return () => useSyncExternalStore(subscribe, matches)
}

/** The CSS @media rules repeat this 900px (a variable cannot be used there): keep them in step. */
export const useWide = media('(min-width: 900px)')
export const useFinePointer = media('(pointer: fine)')
