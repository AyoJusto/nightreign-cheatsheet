import { useSyncExternalStore } from 'react'

// subscribe and getSnapshot are made once per query: a new subscribe on each render would make React resubscribe.
const media = (q: string) => {
  const query = matchMedia(q)
  const subscribe = (cb: () => void) => (query.addEventListener('change', cb), () => query.removeEventListener('change', cb))
  const matches = () => query.matches
  return () => useSyncExternalStore(subscribe, matches)
}

/** Desktop layout. The CSS repeats this 900px in its @media rules (a CSS variable cannot be used there): keep them in step. */
export const useWide = media('(min-width: 900px)')
/** A mouse or trackpad: copy says "Click" there and "Tap" on touch. */
export const useFinePointer = media('(pointer: fine)')
