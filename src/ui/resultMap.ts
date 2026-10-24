import type { MapContent, MapMarker, MarkTap, Pin } from './mapTypes'
import { bestiary } from '../bestiary/bestiary'
import type { Enemy } from '../bestiary/enemy'
import type { MarkerLayer, Seed } from '../domain/seed'
import { splitStructure, structureName } from '../domain/names'
import { catalog } from '../data/catalog'
import { gearForTheRun } from '../domain/gear'

const HINT_SITES = new Set(['sorcerers-rise', 'ruined-rise'])
const mapName = (key: string, name: string) => (HINT_SITES.has(splitStructure(key).kind) ? `Rise · ${name}` : name)

export type Layer = 'structures' | 'spawn' | MarkerLayer

export function resultMap(seed: Seed, on: ReadonlySet<Layer>): MapContent {
  const coords = catalog.slotsOf(seed.earth)
  const pins: Pin[] = []
  const structureAtSpawn = on.has('structures') ? seed.slots[seed.spawn] : null
  if (on.has('spawn')) {
    pins.push({ slot: seed.spawn, ...coords[seed.spawn], state: 'spawn', structure: structureAtSpawn, label: structureAtSpawn ? `Spawn point, ${structureName(structureAtSpawn)}` : 'Spawn point' })
  }
  if (on.has('structures')) {
    const matchingCamps = new Set(gearForTheRun(seed).camps)
    for (const [slot, key] of Object.entries(seed.slots)) {
      if (!key || (slot === seed.spawn && on.has('spawn'))) continue
      const inside = seed.inside[slot]
      pins.push({ slot, ...coords[slot], state: 'sighted', structure: key, label: inside ? `${structureName(key)}, ${inside}` : structureName(key), name: inside && mapName(key, inside), weaponHitsRunWeakness: matchingCamps.has(slot) || undefined })
    }
  }
  const markers: MapMarker[] = [
    ...seed.markers.filter((m) => on.has(m.layer)),
    ...(on.has('boss') ? castleMarkers(seed) : []),
    ...(on.has('structures') ? caravans(seed) : []),
  ]
  return { pins, markers }
}

function castleMarkers(seed: Seed): MapMarker[] {
  const at = catalog.castleOf(seed.earth)
  if (!at || !seed.castle) return []
  const { crew, rooftop, basement } = seed.castle
  return [
    { layer: 'castle', ...at.crew, label: crew, nameWithoutIcon: true },
    ...(rooftop ? [{ layer: 'castle' as const, ...at.rooftop, label: rooftop, great: true }] : []),
    ...(basement ? [{ layer: 'castle' as const, ...at.basement, label: basement }] : []),
  ]
}

function caravans(seed: Seed): MapMarker[] {
  const coords = catalog.slotsOf(seed.earth)
  const isOpenGround = (slot: string) => !seed.slots[slot]
  return Object.entries(seed.inside)
    .filter(([slot]) => isOpenGround(slot) && coords[slot])
    .map(([slot, label]) => ({ layer: 'caravan', ...coords[slot], label }))
}

const NIGHT_LABEL = /^Night \d: /

export function enemyOfMark(tap: Pick<MarkTap, 'marker' | 'site'>): Enemy | undefined {
  const label = tap.marker?.label ?? tap.site ?? ''
  const isListOfPossibleBosses = label.includes(', ')
  const isRiseClue = label.startsWith('Rise · ')
  if (isListOfPossibleBosses || isRiseClue) return undefined
  if (tap.marker?.layer === 'circle') return bestiary.nightBoss(label.replace(NIGHT_LABEL, ''))
  if (tap.marker && !['boss', 'evergaol', 'castle'].includes(tap.marker.layer)) return undefined
  return bestiary.named(label)
}
