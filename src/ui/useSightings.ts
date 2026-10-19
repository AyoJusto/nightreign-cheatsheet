import { useMemo, useState, useCallback } from 'react'
import { Scouting } from '../domain/scouting'
import type { Seed } from '../domain/seed'
import { currentPathname, currentSearch, decodeSightings, replacePath, sightingsQuery } from './router'

/** `past` holds every earlier scouting, newest last. */
export interface Timeline { now: Scouting; past: readonly Scouting[] }
export const record = (t: Timeline, next: Scouting): Timeline => ({ now: next, past: [...t.past, t.now] })
export const stepBack = (t: Timeline): Timeline =>
  t.past.length ? { now: t.past[t.past.length - 1], past: t.past.slice(0, -1) } : t

/** Sightings live in `?s=`, so a refresh or stray swipe loses nothing; every change, Reset included, can be undone. */
export function useSightings(pool: readonly Seed[]): { scouting: Scouting; update: (next: Scouting) => void; undo?: () => void } {
  const initial = useMemo(() => {
    // Replayed one at a time, so Undo steps back through sightings that came from the URL too.
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
