import { useEffect, useState, useCallback } from 'react'
import { NIGHTLORDS, EARTHS, type EarthId, type NightlordPick } from '../domain/names'
import type { Sighting } from '../domain/scouting'
import type { Seed } from '../domain/seed'
import { catalog } from '../data/catalog'

export type Route =
  | { name: 'home' }
  | { name: 'find'; nightlord: NightlordPick; earth: EarthId }
  | { name: 'seed'; id: string }
  | { name: 'about' }

const SLOT = /^\d{1,3}$/
const KEY = /^[a-z-]+(:[a-z]+)?$/

export const encodeSightings = (list: readonly Sighting[]) =>
  list
    .map((s) => (s.type === 'spawn' ? `spawn@${s.slot}` : s.type === 'nothing' ? `${s.slot}@none` : `${s.slot}@${s.structure}`))
    .join(',')

export function decodeSightings(q: string | null): Sighting[] {
  const out: Sighting[] = []
  for (const part of (q ?? '').split(',')) {
    const [a, b] = part.split('@')
    if (a === 'spawn' && SLOT.test(b ?? '')) out.push({ type: 'spawn', slot: b })
    else if (SLOT.test(a ?? '') && b === 'none') out.push({ type: 'nothing', slot: a })
    else if (SLOT.test(a ?? '') && KEY.test(b ?? '')) out.push({ type: 'structure', slot: a, structure: b })
  }
  return out
}

export const sightingsQuery = (list: readonly Sighting[]) =>
  list.length ? `?${new URLSearchParams({ s: encodeSightings(list) })}` : ''

export const findPath = (nightlord: NightlordPick, earth: EarthId, sightings: readonly Sighting[] = []) =>
  `/find/${nightlord}/${earth}${sightingsQuery(sightings)}`

export function seedPath(id: string, sightings: readonly Sighting[], unknown: boolean) {
  const q = new URLSearchParams()
  if (sightings.length) q.set('s', encodeSightings(sightings))
  if (unknown) q.set('n', 'unknown')
  // not q.size: iOS 16 Safari lacks it
  const query = q.toString()
  return `/seed/${id}${query ? `?${query}` : ''}`
}

/** One sighting back, so the finder does not solve the seed again and bounce straight back to it. */
export function resultBackPath(search: string, seed: Pick<Seed, 'nightlord' | 'earth'>) {
  const params = new URLSearchParams(search)
  const q = params.get('s')
  if (q === null) return '/'
  const nightlord = params.get('n') === 'unknown' ? 'unknown' : seed.nightlord
  return findPath(nightlord, seed.earth, decodeSightings(q).slice(0, -1))
}

export function parseRoute(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'about') return { name: 'about' }
  if (parts[0] === 'seed' && parts[1] && catalog.seed(parts[1])) return { name: 'seed', id: parts[1] }
  if (parts[0] === 'find') {
    const nightlord = parts[1] === 'unknown' ? 'unknown' : NIGHTLORDS.find((n) => n.id === parts[1])?.id
    const earth = EARTHS.find((e) => e.id === parts[2])?.id
    if (nightlord && earth && catalog.earthsFor(nightlord).includes(earth)) return { name: 'find', nightlord, earth }
  }
  return { name: 'home' }
}

const appPath = () => location.hash.slice(1) || '/'
export const currentPathname = () => appPath().split('?')[0]
export const currentSearch = () => {
  const path = appPath()
  const start = path.indexOf('?')
  return start < 0 ? '' : path.slice(start)
}
export const replacePath = (path: string) => history.replaceState(history.state, '', `#${path}`)
export const linkTo = (path: string) => `${location.href.split('#')[0]}#${path}`

type Entry = { from: string } | null

/**
 * `go(path, true)` is an in-app Back: it steps back through history when the previous entry is already `path`,
 * so the browser's own Back and Forward agree with it; a shared link opened directly has no such entry.
 */
export function useRoute(): [Route, (path: string, back?: boolean) => void] {
  const [route, setRoute] = useState(() => parseRoute(currentPathname()))
  useEffect(() => {
    const follow = () => setRoute(parseRoute(currentPathname()))
    addEventListener('popstate', follow)
    addEventListener('hashchange', follow)
    return () => {
      removeEventListener('popstate', follow)
      removeEventListener('hashchange', follow)
    }
  }, [])
  const go = useCallback((path: string, back = false) => {
    if (back && (history.state as Entry)?.from === path) return history.back()
    if (back) replacePath(path)
    else history.pushState({ from: appPath() } satisfies Entry, '', `#${path}`)
    setRoute(parseRoute(path.split('?')[0]))
  }, [])
  return [route, go]
}
