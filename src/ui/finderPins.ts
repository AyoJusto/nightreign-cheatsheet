import type { Pin } from './mapTypes'
import { structureName, type SlotId, type StructureKey } from '../domain/names'
import type { Scouting, Sighting } from '../domain/scouting'

export const sightingLabel = (s: Sighting) =>
  s.type === 'spawn' ? 'Spawn point' : s.type === 'structure' ? structureName(s.structure) : 'Nothing here'

/** The finder map's pins, one per slot still worth showing, each in its state for this step of the scouting. */
export function buildPins(scouting: Scouting, coords: Record<SlotId, { x: number; y: number }>, focus: StructureKey | null): Pin[] {
  const pins: Pin[] = []
  const spawn = scouting.sightings.find((s) => s.type === 'spawn')
  const sighted = new Map(scouting.sightings.flatMap((s) => (s.type === 'spawn' ? [] : [[s.slot, s] as const])))
  const certain = scouting.certainSlots()
  const focusSlots = new Set(focus ? scouting.structuresInPlay().find((p) => p.structure === focus)?.slots ?? [] : [])

  // Focus mode asks one question, so only its candidates stay gold: the spawn options dim with the rest of the
  // map (a spawn option that could hold the structure is a candidate), and a tap on one cancels, recording nothing.
  const spawnOptions = new Map(spawn ? [] : scouting.spawnOptions().map(({ slot, remaining }) => [slot, remaining]))
  if (spawn) {
    const here = sighted.get(spawn.slot)
    // A Church recorded at the spawn point shows on the spawn pin, as the result map draws it.
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
    if (s) {
      pins.push({ slot, ...coords[slot], state: 'sighted', structure: s.type === 'structure' ? s.structure : null, label: `${sightingLabel(s)}, sighted` })
    } else if (focusSlots.has(slot)) {
      // A certain slot can still be confirmed in focus mode, so it joins the candidates.
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
