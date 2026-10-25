import { useEffect, useState, useCallback, useRef } from 'react'
import { flushSync } from 'react-dom'
import { NIGHTLORDS, EARTHS, type EarthId, type NightlordId, type NightlordPick } from '../domain/names'
import { bestiary } from '../bestiary/bestiary'
import type { Sighting } from '../domain/scouting'
import type { Seed } from '../domain/seed'
import { catalog } from '../data/catalog'
import { HERO_IMAGE_WAIT_MS, screenArrival } from './motion'

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

export function resultBackPath(search: string, seed: Pick<Seed, 'nightlord' | 'earth'>) {
  const params = new URLSearchParams(search)
  const q = params.get('s')
  if (q === null) return PICK_PATH
  const nightlord = params.get('n') === 'unknown' ? 'unknown' : seed.nightlord
  const priorSightings = decodeSightings(q).slice(0, -1)
  return findPath(nightlord, seed.earth, priorSightings)
}

export function parseRoute(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean)
  const [first, second] = parts
  const nightlord = NIGHTLORDS.find((n) => n.id === (first === 'nightlord' ? second : first))
  if (nightlord && (first === 'nightlord' || parts.length === 1)) return { name: 'nightlord', id: nightlord.id }
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

type Entry = { from?: string; idx: number } | null
type Nav = 'forward' | 'back' | 'fade'

const entryIndex = () => (history.state as Entry)?.idx ?? 0
const ENTRIES_KEY = 'entries'
function readEntries(): { scroll: [number, number][]; kept: [number, Record<string, unknown>][] } {
  try {
    return JSON.parse(sessionStorage.getItem(ENTRIES_KEY) ?? '') ?? { scroll: [], kept: [] }
  } catch {
    return { scroll: [], kept: [] }
  }
}
const saved = readEntries()
const scrollAt = new Map<number, number>(saved.scroll)
const keptAt = new Map<number, Record<string, unknown>>(saved.kept)
const rememberScroll = () => scrollAt.set(entryIndex(), scrollY)
function persistEntries() {
  rememberScroll()
  try {
    sessionStorage.setItem(ENTRIES_KEY, JSON.stringify({ scroll: [...scrollAt], kept: [...keptAt] }))
  } catch {
    return
  }
}
const forget = (idx: number) => {
  scrollAt.delete(idx)
  keptAt.delete(idx)
}
let ownBack = false
let lastIdx = 0
let clicked: Element | null = null
let running: ViewTransition | null = null

export const screenKey = (route: Route) => (route.name === 'find' || route.name === 'seed' ? 'map' : JSON.stringify(route))

const inAppLink = (e: MouseEvent) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null
  const href = (e.target as Element | null)?.closest('a')?.getAttribute('href')
  return href?.startsWith('#/') ? href.slice(1) : null
}

export function goBack(fallback: string, go: (path: string, back?: boolean) => void) {
  const cameFromInApp = (history.state as Entry)?.from !== undefined
  if (!cameFromInApp) return go(fallback, true)
  rememberScroll()
  ownBack = true
  history.back()
}

export function useKept<T>(name: string, initial: T): [T, (value: T) => void] {
  const [idx] = useState(entryIndex)
  const [value, setValue] = useState(() => (keptAt.get(idx)?.[name] as T | undefined) ?? initial)
  const keep = useCallback((next: T) => {
    setValue(next)
    keptAt.set(idx, { ...keptAt.get(idx), [name]: next })
  }, [idx, name])
  return [value, keep]
}

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function nameHeroes(source: Element | null) {
  if (!source || prefersReducedMotion()) return []
  return [...source.querySelectorAll<HTMLElement>('[data-hero-from]')].map((el) => {
    el.style.viewTransitionName = `hero-${el.dataset.heroFrom}`
    return el
  })
}

function nameTargets(sources: HTMLElement[]) {
  return sources.flatMap((source) => {
    const target = document.querySelector<HTMLElement>(`[data-hero="${source.dataset.heroFrom}"]`)
    if (!target) return []
    target.style.viewTransitionName = source.style.viewTransitionName
    return [target]
  })
}

const imagesReady = (els: HTMLElement[]) => Promise.race([
  Promise.all(els.filter((el) => el instanceof HTMLImageElement).map((img) => img.decode().catch(() => undefined))),
  new Promise((done) => setTimeout(done, HERO_IMAGE_WAIT_MS)),
])

export function useRoute(): [Route, (path: string, back?: boolean) => void] {
  const [route, setRoute] = useState(() => parseRoute(currentPathname()))
  const shown = useRef(route)

  const show = useCallback((next: Route, nav: Nav, scroll: number) => {
    const source = clicked?.closest('a, button') ?? null
    clicked = null
    const sameScreen = screenKey(next) === screenKey(shown.current)
    shown.current = next
    if (sameScreen) return setRoute(next)
    running?.skipTransition()
    const commit = () => {
      screenArrival.returning = nav !== 'forward'
      flushSync(() => setRoute(next))
      screenArrival.returning = false
      scrollTo(0, scroll)
    }
    if (!document.startViewTransition) return commit()
    const root = document.documentElement
    const sources = nameHeroes(source)
    let targets: HTMLElement[] = []
    root.dataset.nav = nav
    const transition = document.startViewTransition(async () => {
      commit()
      targets = nameTargets(sources)
      await imagesReady(targets)
    })
    running = transition
    transition.finished.finally(() => {
      for (const el of [...sources, ...targets]) el.style.viewTransitionName = ''
      if (running !== transition) return
      running = null
      delete root.dataset.nav
    })
  }, [])

  useEffect(() => {
    history.scrollRestoration = 'manual'
    const arrived = history.state as Entry
    if (arrived?.idx === undefined) {
      forget(0)
      history.replaceState({ ...arrived, idx: 0 } satisfies Entry, '')
    }
    lastIdx = entryIndex()
    scrollTo(0, scrollAt.get(lastIdx) ?? 0)
    const remember = (e: MouseEvent) => {
      clicked = e.target as Element
      setTimeout(() => { clicked = null })
    }
    const follow = () => {
      scrollAt.set(lastIdx, scrollY)
      const state = history.state as Entry
      if (state?.idx === undefined) {
        forget(lastIdx + 1)
        history.replaceState({ ...state, idx: lastIdx + 1 } satisfies Entry, '')
      }
      lastIdx = entryIndex()
      const nav: Nav = ownBack ? 'back' : 'fade'
      ownBack = false
      show(parseRoute(currentPathname()), nav, scrollAt.get(lastIdx) ?? 0)
    }
    document.addEventListener('click', remember, true)
    addEventListener('popstate', follow)
    addEventListener('pagehide', persistEntries)
    const missedBeforeListening = parseRoute(currentPathname())
    if (JSON.stringify(missedBeforeListening) !== JSON.stringify(shown.current)) {
      shown.current = missedBeforeListening
      setRoute(missedBeforeListening)
    }
    return () => {
      document.removeEventListener('click', remember, true)
      removeEventListener('popstate', follow)
      removeEventListener('pagehide', persistEntries)
    }
  }, [show])

  const go = useCallback((path: string, back = false) => {
    if (back && (history.state as Entry)?.from === path) {
      rememberScroll()
      ownBack = true
      return history.back()
    }
    const idx = back ? entryIndex() : entryIndex() + 1
    lastIdx = idx
    rememberScroll()
    if (back) replacePath(path)
    else history.pushState({ from: appPath(), idx } satisfies Entry, '', `#${path}`)
    forget(idx)
    show(parseRoute(path.split('?')[0]), back ? 'back' : 'forward', 0)
  }, [show])

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
