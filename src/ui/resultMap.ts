import type { MapContent, MapMarker, MarkTap, Pin } from './mapTypes'
import { bestiary } from '../bestiary/bestiary'
import type { Enemy } from '../bestiary/enemy'
import type { MarkerLayer, Seed } from '../domain/seed'
import { splitStructure, structureName } from '../domain/names'
import { catalog } from '../data/catalog'

// A rise's puzzle clue ("Above Door") means nothing alone on the map: it carries the site it belongs to.
const HINT_SITES = new Set(['sorcerers-rise', 'ruined-rise'])
const mapName = (key: string, name: string) => (HINT_SITES.has(splitStructure(key).kind) ? `Rise · ${name}` : name)

/** The result map's layers: the seed's markers, plus its structures and its spawn. */
export type Layer = 'structures' | 'spawn' | MarkerLayer

/** What the result map shows of a seed with these layers on: its pins, and its markers. */
export function resultMap(seed: Seed, on: ReadonlySet<Layer>): MapContent {
  const coords = catalog.slotsOf(seed.earth)
  const pins: Pin[] = []
  // A Church stands at the spawn point in 65 seeds: with both layers on, the spawn pin carries its art.
  const atSpawn = on.has('structures') ? seed.slots[seed.spawn] : null
  if (on.has('spawn')) {
    pins.push({ slot: seed.spawn, ...coords[seed.spawn], state: 'spawn', structure: atSpawn, label: atSpawn ? `Spawn point, ${structureName(atSpawn)}` : 'Spawn point' })
  }
  if (on.has('structures')) {
    for (const [slot, key] of Object.entries(seed.slots)) {
      if (!key || (slot === seed.spawn && on.has('spawn'))) continue
      // What is inside is written on the map under the art, and spoken as part of the pin's name.
      const name = seed.inside[slot]
      pins.push({ slot, ...coords[slot], state: 'sighted', structure: key, label: name ? `${structureName(key)}, ${name}` : structureName(key), name: name && mapName(key, name) })
    }
  }
  const markers: MapMarker[] = [
    ...seed.markers.filter((m) => on.has(m.layer)),
    ...(on.has('boss') ? castleMarkers(seed) : []),
    ...(on.has('structures') ? caravans(seed) : []),
  ]
  return { pins, markers }
}

// The castle's guard written over the castle, with its rooftop (great crest) and basement (field crest) bosses where
// the game draws them; the Bosses layer shows them with the field bosses.
function castleMarkers(seed: Seed): MapMarker[] {
  const at = catalog.castleOf(seed.earth)
  if (!at || !seed.castle) return []
  const { crew, rooftop, basement } = seed.castle
  return [
    { layer: 'castle', ...at.crew, label: crew, plain: true },
    ...(rooftop ? [{ layer: 'castle' as const, ...at.rooftop, label: rooftop, great: true }] : []),
    ...(basement ? [{ layer: 'castle' as const, ...at.basement, label: basement }] : []),
  ]
}

// Caravans stand on open ground where nothing is built: a small cart, drawn in the game icons' style, and a name.
function caravans(seed: Seed): MapMarker[] {
  const coords = catalog.slotsOf(seed.earth)
  return Object.entries(seed.inside)
    .filter(([slot]) => !seed.slots[slot] && coords[slot])
    .map(([slot, label]) => ({ layer: 'caravan', ...coords[slot], label }))
}

const NIGHT_LABEL = /^Night \d: /

/** The enemy a tapped name stands for. A list of possible bosses, a rise's clue or a caravan stands for none. */
export function enemyOfMark(tap: Pick<MarkTap, 'marker' | 'site'>): Enemy | undefined {
  const label = tap.marker?.label ?? tap.site ?? ''
  if (label.includes(', ') || label.startsWith('Rise · ')) return undefined
  if (tap.marker?.layer === 'circle') return bestiary.nightBoss(label.replace(NIGHT_LABEL, ''))
  if (tap.marker && !['boss', 'evergaol', 'castle'].includes(tap.marker.layer)) return undefined
  return bestiary.named(label)
}
