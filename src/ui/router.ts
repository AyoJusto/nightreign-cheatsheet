import { useEffect, useState, useCallback } from 'react'
import { NIGHTLORDS, EARTHS, type EarthId, type NightlordId, type NightlordPick } from '../domain/names'
import { bestiary } from '../bestiary/bestiary'
import type { Sighting } from '../domain/scouting'
import type { Seed } from '../domain/seed'
import { catalog } from '../data/catalog'

export type EffectGroup = 'relics' | 'weapons'

export type Route =
  | { name: 'home' }
  | { name: 'pick'; nightlord?: NightlordPick }
  | { name: 'find'; nightlord: NightlordPick; earth: EarthId }
  | { name: 'seed'; id: string }
  | { name: 'nightlords' }
  | { name: 'nightlord'; id: NightlordId }
  | { name: 'bosses' }
  | { name: 'enemy'; id: string }
  | { name: 'effects'; group: EffectGroup }
  | { name: 'builds'; character: string | null }
  | { name: 'about' }

export const PICK_PATH = '/find'

const SLOT = /^\d{1,3}$/
const KEY = /^[a-z-]+(:[a-z]+)?$/
const FIGHT = /^[a-z0-9-]+$/

export const encodeSightings = (list: readonly Sighting[]) =>
  list
    .map((s) => {
      if (s.type === 'spawn') return `spawn@${s.slot}`
      if (s.type === 'night1') return `night1@${s.boss}`
      return s.type === 'nothing' ? `${s.slot}@none` : `${s.slot}@${s.structure}`
    })
    .join(',')

export function decodeSightings(q: string | null): Sighting[] {
  const out: Sighting[] = []
  for (const part of (q ?? '').split(',')) {
    const [a, b] = part.split('@')
    if (a === 'spawn' && SLOT.test(b ?? '')) out.push({ type: 'spawn', slot: b })
    else if (a === 'night1' && FIGHT.test(b ?? '')) out.push({ type: 'night1', boss: b })
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
  if (q === null) return PICK_PATH
  const nightlord = params.get('n') === 'unknown' ? 'unknown' : seed.nightlord
  return findPath(nightlord, seed.earth, decodeSightings(q).slice(0, -1))
}

export function parseRoute(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean)
  const [first, second] = parts
  const nightlord = NIGHTLORDS.find((n) => n.id === (first === 'nightlord' ? second : first))
  if (nightlord && (first === 'nightlord' || parts.length === 1)) return { name: 'nightlord', id: nightlord.id }
  if (first === 'about') return { name: 'about' }
  if (first === 'nightlords') return { name: 'nightlords' }
  if (first === 'bosses') return { name: 'bosses' }
  if ((first === 'enemy' || first === 'boss') && second && bestiary.enemy(second)) return { name: 'enemy', id: second }
  if (first === 'effects' && (second === 'relics' || second === 'weapons')) return { name: 'effects', group: second }
  if (first === 'builds') return { name: 'builds', character: second ?? null }
  if (first === 'seed' && second && catalog.seed(second)) return { name: 'seed', id: second }
  if (first === 'find' && parts.length === 1) return { name: 'pick' }
  if (first === 'find' && parts.length === 2) {
    const pick = parts[1] === 'unknown' ? 'unknown' : NIGHTLORDS.find((n) => n.id === parts[1])?.id
    return pick ? { name: 'pick', nightlord: pick } : { name: 'home' }
  }
  if (first === 'find') {
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

const inAppLink = (e: MouseEvent) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null
  const href = (e.target as Element | null)?.closest('a')?.getAttribute('href')
  return href?.startsWith('#/') ? href.slice(1) : null
}

/** Back to wherever the user came from in the app, or to `fallback` when the page was opened directly. */
export function goBack(fallback: string, go: (path: string, back?: boolean) => void) {
  if ((history.state as Entry)?.from !== undefined) history.back()
  else go(fallback, true)
}

/** `go(path, true)` is an in-app Back: it pops history when the previous entry is `path`, so browser Back agrees. */
export function useRoute(): [Route, (path: string, back?: boolean) => void] {
  const [route, setRoute] = useState(() => parseRoute(currentPathname()))
  useEffect(() => {
    const follow = () => setRoute(parseRoute(currentPathname()))
    const arrive = () => {
      follow()
      scrollTo(0, 0)
    }
    addEventListener('popstate', follow)
    addEventListener('hashchange', arrive)
    return () => {
      removeEventListener('popstate', follow)
      removeEventListener('hashchange', arrive)
    }
  }, [])
  const go = useCallback((path: string, back = false) => {
    if (back && (history.state as Entry)?.from === path) return history.back()
    if (back) replacePath(path)
    else {
      history.pushState({ from: appPath() } satisfies Entry, '', `#${path}`)
      scrollTo(0, 0)
    }
    setRoute(parseRoute(path.split('?')[0]))
  }, [])
  useEffect(() => {
    const followLink = (e: MouseEvent) => {
      const path = inAppLink(e)
      if (path === null) return
      e.preventDefault()
      go(path)
    }
    document.addEventListener('click', followLink)
    return () => document.removeEventListener('click', followLink)
  }, [go])
  return [route, go]
}
