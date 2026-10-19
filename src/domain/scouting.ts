import type { Seed } from './seed'
import type { SlotId, StructureKey } from './names'
import { bestiary } from '../bestiary/bestiary'

/** `night1`: the boss the first night closed on, by its fight's id. */
export type Sighting =
  | { type: 'spawn'; slot: SlotId }
  | { type: 'structure'; slot: SlotId; structure: StructureKey }
  | { type: 'nothing'; slot: SlotId }
  | { type: 'night1'; boss: string }
export type Target = SlotId | 'spawn' | 'night1'
export const targetOf = (s: Sighting): Target => (s.type === 'spawn' || s.type === 'night1' ? s.type : s.slot)
const siteOf = (s: Sighting): SlotId | null => (s.type === 'structure' || s.type === 'nothing' ? s.slot : null)
export const nightOneFight = (seed: Seed) => bestiary.nightBoss(seed.nights[1].boss)?.id
export type Option = StructureKey | 'nothing'

export class ImpossibleSighting extends Error {}

const matches = (seed: Seed, s: Sighting) => {
  if (s.type === 'spawn') return seed.spawn === s.slot
  if (s.type === 'night1') return nightOneFight(seed) === s.boss
  // seed.slots lists every slot on the map, so a slot it lacks is not "nothing": it is not there at all.
  if (!Object.hasOwn(seed.slots, s.slot)) return false
  const actual = seed.slots[s.slot]
  return s.type === 'nothing' ? actual === null : actual === s.structure
}
const sameTarget = (a: Sighting, b: Sighting) => targetOf(a) === targetOf(b)
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

  retract(target: Target): Scouting {
    return new Scouting(this.pool, this.sightings.filter((s) => targetOf(s) !== target))
  }

  possibilitiesAt(slot: SlotId) {
    const others = this.sightings.filter((s) => siteOf(s) !== slot)
    const counts = new Map<Option, number>()
    for (const seed of this.filtered(others)) {
      const option: Option = seed.slots[slot] ?? 'nothing'
      counts.set(option, (counts.get(option) ?? 0) + 1)
    }
    return [...counts].map(([option, remaining]) => ({ option, remaining })).sort(byRemainingThenOption)
  }

  /** Each way the player could have spawned at this site: on open ground, or beside what some seed builds there. */
  spawnChoicesAt(slot: SlotId): { structure: StructureKey | null; remaining: number }[] {
    const spawn = this.sightings.find((s) => s.type === 'spawn')
    if (spawn && spawn.slot !== slot) return []
    const others = this.sightings.filter((s) => s.type !== 'spawn' && siteOf(s) !== slot)
    const counts = new Map<StructureKey | null, number>()
    for (const seed of this.filtered(others)) {
      if (seed.spawn === slot) counts.set(seed.slots[slot] ?? null, (counts.get(seed.slots[slot] ?? null) ?? 0) + 1)
    }
    return [...counts].map(([structure, remaining]) => ({ structure, remaining })).sort((a, b) => b.remaining - a.remaining)
  }

  spawnedAt(slot: SlotId, structure: StructureKey | null): Scouting {
    const spawned = this.retract(slot).sight({ type: 'spawn', slot })
    return structure ? spawned.sight({ type: 'structure', slot, structure }) : spawned
  }

  spawnOptions() {
    const counts = new Map<SlotId, number>()
    for (const seed of this.filtered(this.sightings.filter((s) => s.type !== 'spawn'))) {
      counts.set(seed.spawn, (counts.get(seed.spawn) ?? 0) + 1)
    }
    return [...counts].map(([slot, remaining]) => ({ slot, remaining })).sort(byRemainingThenSlot)
  }

  nightOneOptions() {
    const counts = new Map<string, number>()
    for (const seed of this.filtered(this.sightings.filter((s) => s.type !== 'night1'))) {
      const fight = nightOneFight(seed)
      if (fight) counts.set(fight, (counts.get(fight) ?? 0) + 1)
    }
    return [...counts].map(([boss, remaining]) => ({ boss, remaining })).sort((a, b) => b.remaining - a.remaining || a.boss.localeCompare(b.boss))
  }

  structuresInPlay() {
    const sighted = new Set(this.sightings.flatMap((s) => siteOf(s) ?? []))
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
    const sighted = new Set(this.sightings.flatMap((s) => siteOf(s) ?? []))
    const certain = new Map<SlotId, StructureKey | null>()
    if (!first) return certain
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
