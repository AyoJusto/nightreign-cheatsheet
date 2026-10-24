import { useMemo, useState, useCallback } from 'react'
import { Scouting, type Sighting } from '../domain/scouting'
import type { Seed } from '../domain/seed'
import { currentPathname, currentSearch, decodeSightings, replacePath, sightingsQuery } from './router'

export interface Timeline { now: Scouting; past: readonly Scouting[] }
export const record = (t: Timeline, next: Scouting): Timeline => ({ now: next, past: [...t.past, t.now] })
export const stepBack = (t: Timeline): Timeline =>
  t.past.length ? { now: t.past[t.past.length - 1], past: t.past.slice(0, -1) } : t
const tryRecord = (t: Timeline, sighting: Sighting): Timeline => {
  try { return record(t, t.now.sight(sighting)) } catch { return t }
}

export function useSightings(pool: readonly Seed[]): { scouting: Scouting; update: (next: Scouting) => void; undo?: () => void } {
  const initial = useMemo(() => {
    let t: Timeline = { now: Scouting.start(pool), past: [] }
    for (const sighting of decodeSightings(new URLSearchParams(currentSearch()).get('s'))) {
      t = tryRecord(t, sighting)
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
