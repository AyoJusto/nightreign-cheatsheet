import { useMemo, useState, useCallback } from 'react'
import { Scouting } from '../domain/scouting'
import type { Seed } from '../domain/seed'
import { currentPathname, currentSearch, decodeSightings, replacePath, sightingsQuery } from './router'

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
    for (const sighting of decodeSightings(new URLSearchParams(currentSearch()).get('s'))) {
      try { t = record(t, t.now.sight(sighting)) } catch { /* a stale or edited URL: drop what no longer fits */ }
    }
    return t
  }, [pool])
  const [timeline, setTimeline] = useState(initial)
  const show = useCallback((t: Timeline) => {
    replacePath(currentPathname() + sightingsQuery(t.now.sightings))
    setTimeline(t)
  }, [])
  const update = useCallback((next: Scouting) => show(record(timeline, next)), [timeline, show])
  const undo = useCallback(() => show(stepBack(timeline)), [timeline, show])
  return { scouting: timeline.now, update, undo: timeline.past.length ? undo : undefined }
}
