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

/** The current scouting and every earlier one, newest last, so Undo can walk back through any change. */
export interface Timeline { now: Scouting; past: readonly Scouting[] }
export const record = (t: Timeline, next: Scouting): Timeline => ({ now: next, past: [...t.past, t.now] })
export const stepBack = (t: Timeline): Timeline =>
  t.past.length ? { now: t.past[t.past.length - 1], past: t.past.slice(0, -1) } : t

/**
 * Scouting whose sightings live in `?s=`, so refresh or a stray swipe loses nothing. Every change, Reset
 * included, is recorded in memory, so Undo restores exactly what the last change replaced.
 */
export function useSightings(pool: readonly Seed[]): { scouting: Scouting; update: (next: Scouting) => void; undo?: () => void } {
  const initial = useMemo(() => {
    // Sightings from the URL (a refresh, or Back from a result) are replayed as changes, so Undo still steps
    // back through them one at a time.
    let t: Timeline = { now: Scouting.start(pool), past: [] }
    for (const sighting of decodeSightings(new URLSearchParams(location.search).get('s'))) {
      try { t = record(t, t.now.sight(sighting)) } catch { /* a stale or edited URL: drop what no longer fits */ }
    }
    return t
  }, [pool])
  const [timeline, setTimeline] = useState(initial)
  const show = useCallback((t: Timeline) => {
    const url = new URL(location.href)
    if (t.now.sightings.length) url.searchParams.set('s', encodeSightings(t.now.sightings))
    else url.searchParams.delete('s')
    history.replaceState(history.state, '', url)
    setTimeline(t)
  }, [])
  const update = useCallback((next: Scouting) => show(record(timeline, next)), [timeline, show])
  const undo = useCallback(() => show(stepBack(timeline)), [timeline, show])
  return { scouting: timeline.now, update, undo: timeline.past.length ? undo : undefined }
}
