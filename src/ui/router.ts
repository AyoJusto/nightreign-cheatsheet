import { useEffect, useState, useCallback } from 'react'
import { NIGHTLORDS, EARTHS, type EarthId, type NightlordId } from '../domain/names'
import { catalog } from '../data/catalog'

export type Route =
  | { name: 'home' }
  | { name: 'find'; nightlord: NightlordId; earth: EarthId }
  | { name: 'seed'; id: string }
  | { name: 'about' }

export function parseRoute(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'about') return { name: 'about' }
  if (parts[0] === 'seed' && parts[1] && catalog.seed(parts[1])) return { name: 'seed', id: parts[1] }
  if (parts[0] === 'find') {
    const nightlord = NIGHTLORDS.find((n) => n.id === parts[1])?.id
    const earth = EARTHS.find((e) => e.id === parts[2])?.id
    if (nightlord && earth && catalog.earthsFor(nightlord).includes(earth)) return { name: 'find', nightlord, earth }
  }
  return { name: 'home' }
}

/** Where a pushed entry was pushed from, so an in-app Back can tell whether the previous entry is its target. */
type Entry = { from: string } | null
const here = () => location.pathname + location.search

/**
 * `go(path)` pushes a new entry. `go(path, true)` is an in-app Back: it steps back through history when the
 * previous entry is already `path`, so the browser's own Back and Forward agree with it afterwards; otherwise
 * (a shared link opened directly) it replaces the current entry rather than pushing a duplicate.
 */
export function useRoute(): [Route, (path: string, back?: boolean) => void] {
  const [route, setRoute] = useState(() => parseRoute(location.pathname))
  useEffect(() => {
    const onPop = () => setRoute(parseRoute(location.pathname))
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])
  const go = useCallback((path: string, back = false) => {
    if (back && (history.state as Entry)?.from === path) return history.back() // popstate sets the route
    if (back) history.replaceState(history.state, '', path)
    else history.pushState({ from: here() } satisfies Entry, '', path)
    setRoute(parseRoute(new URL(path, location.origin).pathname))
  }, [])
  return [route, go]
}
