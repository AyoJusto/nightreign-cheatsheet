import type { Pin } from './mapTypes'
import { structureName, type SlotId, type StructureKey } from '../domain/names'
import type { Scouting, Sighting } from '../domain/scouting'
import { bestiary } from '../bestiary/bestiary'

export function sightingLabel(s: Sighting): string {
  if (s.type === 'spawn') return 'Spawn point'
  if (s.type === 'night1') return `Night 1: ${bestiary.enemy(s.boss)?.name ?? s.boss}`
  return s.type === 'structure' ? structureName(s.structure) : 'Nothing here'
}

export function buildPins(scouting: Scouting, coords: Record<SlotId, { x: number; y: number }>, focus: StructureKey | null): Pin[] {
  const pins: Pin[] = []
  const spawn = scouting.sightings.find((s) => s.type === 'spawn')
  const sighted = new Map(scouting.sightings.flatMap((s) => (s.type === 'structure' || s.type === 'nothing' ? [[s.slot, s] as const] : [])))
  const certain = scouting.certainSlots()
  const focusSlots = new Set(focus ? scouting.structuresInPlay().find((p) => p.structure === focus)?.slots ?? [] : [])

  const spawnOptions = new Map(spawn ? [] : scouting.spawnOptions().map(({ slot, remaining }) => [slot, remaining]))
  if (spawn) {
    const here = sighted.get(spawn.slot)
    pins.push({
      slot: spawn.slot, ...coords[spawn.slot], state: 'spawn', structure: here?.type === 'structure' ? here.structure : null,
      label: here ? `Your spawn point, ${sightingLabel(here)}` : 'Your spawn point',
    })
  } else if (!focus) {
    for (const [slot, remaining] of spawnOptions) {
      pins.push({ slot, ...coords[slot], state: 'spawn-option', structure: null, label: `Possible spawn point, leaves ${remaining}` })
    }
  }
  const taken = new Set(pins.map((p) => p.slot))
  for (const slot of Object.keys(coords)) {
    if (taken.has(slot)) continue
    const s = sighted.get(slot)
    const known = certain.get(slot) ?? null
    const inFocus = focusSlots.has(slot)
    if (s) {
      pins.push({ slot, ...coords[slot], state: 'sighted', structure: s.type === 'structure' ? s.structure : null, label: `${sightingLabel(s)}, sighted` })
    } else if (inFocus) {
      pins.push({ slot, ...coords[slot], state: 'candidate', structure: known, label: `${structureName(focus!)} here?` })
    } else if (spawnOptions.has(slot)) {
      pins.push({ slot, ...coords[slot], state: 'dimmed', structure: null, label: `Possible spawn point, leaves ${spawnOptions.get(slot)}` })
    } else if (known) {
      pins.push({ slot, ...coords[slot], state: 'certain', structure: known, label: `${structureName(known)}, certain` })
    } else if (scouting.possibilitiesAt(slot).some((p) => p.option !== 'nothing')) {
      pins.push({ slot, ...coords[slot], state: focus ? 'dimmed' : 'open', structure: null, label: 'Unknown site' })
    }
  }
  return pins
}
