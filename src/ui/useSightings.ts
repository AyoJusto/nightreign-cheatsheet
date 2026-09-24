import { useMemo, useState, useCallback } from 'react'
import { Scouting, type Sighting } from '../domain/scouting'
import type { Seed } from '../domain/seed'

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

/** Scouting whose sightings live in `?s=`, so refresh or a stray swipe loses nothing. */
export function useSightings(pool: readonly Seed[]): [Scouting, (next: Scouting) => void] {
  const initial = useMemo(() => {
    let s = Scouting.start(pool)
    for (const sighting of decodeSightings(new URLSearchParams(location.search).get('s'))) {
      try { s = s.sight(sighting) } catch { /* a stale or edited URL: drop what no longer fits */ }
    }
    return s
  }, [pool])
  const [scouting, setScouting] = useState(initial)
  const update = useCallback((next: Scouting) => {
    const url = new URL(location.href)
    if (next.sightings.length) url.searchParams.set('s', encodeSightings(next.sightings))
    else url.searchParams.delete('s')
    history.replaceState(null, '', url)
    setScouting(next)
  }, [])
  return [scouting, update]
}
