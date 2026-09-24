import { useSyncExternalStore } from 'react'

const media = (q: string) => {
  const query = matchMedia(q)
  return () => useSyncExternalStore((cb) => (query.addEventListener('change', cb), () => query.removeEventListener('change', cb)), () => query.matches)
}

export const useWide = media('(min-width: 900px)')
/** A mouse or trackpad: copy says "Click" there and "Tap" on touch. */
export const useFinePointer = media('(pointer: fine)')
