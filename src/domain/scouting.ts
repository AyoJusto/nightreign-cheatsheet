import type { Seed } from './seed'
import type { SlotId, StructureKey } from './names'

export type Sighting =
  | { type: 'spawn'; slot: SlotId }
  | { type: 'structure'; slot: SlotId; structure: StructureKey }
  | { type: 'nothing'; slot: SlotId }
export type Option = StructureKey | 'nothing'

export class ImpossibleSighting extends Error {}

const matches = (seed: Seed, s: Sighting) => {
  if (s.type === 'spawn') return seed.spawn === s.slot
  const actual = seed.slots[s.slot] ?? null
  return s.type === 'nothing' ? actual === null : actual === s.structure
}
const sameTarget = (a: Sighting, b: Sighting) =>
  a.type === 'spawn' || b.type === 'spawn' ? a.type === b.type : a.slot === b.slot
const byRemainingThenOption = (a: { option: Option; remaining: number }, b: { option: Option; remaining: number }) =>
  b.remaining - a.remaining || a.option.localeCompare(b.option)
const byRemainingThenSlot = (a: { slot: SlotId; remaining: number }, b: { slot: SlotId; remaining: number }) =>
  b.remaining - a.remaining || Number(a.slot) - Number(b.slot)

export class Scouting {
  private readonly pool: readonly Seed[]
  readonly sightings: readonly Sighting[]

  private constructor(pool: readonly Seed[], sightings: readonly Sighting[]) {
    this.pool = pool
    this.sightings = sightings
  }

  static start(pool: readonly Seed[]) {
    return new Scouting(pool, [])
  }

  candidates(): readonly Seed[] {
    return this.filtered(this.sightings)
  }

  sight(sighting: Sighting): Scouting {
    const next = [...this.sightings.filter((s) => !sameTarget(s, sighting)), sighting]
    if (this.filtered(next).length === 0) throw new ImpossibleSighting(`no seed matches ${JSON.stringify(sighting)}`)
    return new Scouting(this.pool, next)
  }

  retract(slot: SlotId | 'spawn'): Scouting {
    return new Scouting(
      this.pool,
      this.sightings.filter((s) => (slot === 'spawn' ? s.type !== 'spawn' : s.type === 'spawn' || s.slot !== slot)),
    )
  }

  possibilitiesAt(slot: SlotId) {
    const others = this.sightings.filter((s) => s.type === 'spawn' || s.slot !== slot)
    const counts = new Map<Option, number>()
    for (const seed of this.filtered(others)) {
      const option: Option = seed.slots[slot] ?? 'nothing'
      counts.set(option, (counts.get(option) ?? 0) + 1)
    }
    return [...counts].map(([option, remaining]) => ({ option, remaining })).sort(byRemainingThenOption)
  }

  spawnOptions() {
    const counts = new Map<SlotId, number>()
    for (const seed of this.filtered(this.sightings.filter((s) => s.type !== 'spawn'))) {
      counts.set(seed.spawn, (counts.get(seed.spawn) ?? 0) + 1)
    }
    return [...counts].map(([slot, remaining]) => ({ slot, remaining })).sort(byRemainingThenSlot)
  }

  structuresInPlay() {
    const sighted = new Set(this.sightings.flatMap((s) => (s.type === 'spawn' ? [] : [s.slot])))
    const slotsByStructure = new Map<StructureKey, Set<SlotId>>()
    for (const seed of this.candidates()) {
      for (const [slot, key] of Object.entries(seed.slots)) {
        if (!key || sighted.has(slot)) continue
        if (!slotsByStructure.has(key)) slotsByStructure.set(key, new Set())
        slotsByStructure.get(key)!.add(slot)
      }
    }
    return [...slotsByStructure].map(([structure, slots]) => ({ structure, slots: [...slots] }))
  }

  certainSlots(): Map<SlotId, StructureKey | null> {
    const [first, ...rest] = this.candidates()
    const sighted = new Set(this.sightings.flatMap((s) => (s.type === 'spawn' ? [] : [s.slot])))
    const certain = new Map<SlotId, StructureKey | null>()
    if (!first || rest.length === 0) return certain
    for (const [slot, key] of Object.entries(first.slots)) {
      if (sighted.has(slot) || key === null) continue
      if (rest.every((seed) => seed.slots[slot] === key)) certain.set(slot, key)
    }
    return certain
  }

  identifiedSeed(): Seed | null {
    const c = this.candidates()
    return c.length === 1 ? c[0] : null
  }

  private filtered(sightings: readonly Sighting[]) {
    return this.pool.filter((seed) => sightings.every((s) => matches(seed, s)))
  }
}
