import data from './seeds.json'
import type { CastlePoints, Seed } from '../domain/seed'
import { EARTHS, mapFamily, type EarthId, type NightlordId, type SlotId, type Weakness } from '../domain/names'

const all = data.seeds as unknown as Seed[]
const byId = new Map(all.map((s) => [s.id, s]))
const notes = data.bossNotes as Record<string, string>
const weaknesses = data.weaknesses as { nightlords: Record<NightlordId, Weakness>; bosses: Record<string, Weakness> }

export const catalog = {
  all,
  seed: (id: string) => byId.get(id),
  seedsFor: (nightlord: NightlordId, earth: EarthId) => all.filter((s) => s.nightlord === nightlord && s.earth === earth),
  earthsFor: (nightlord: NightlordId) =>
    EARTHS.map((e) => e.id).filter((earth) => all.some((s) => s.nightlord === nightlord && s.earth === earth)),
  /** Short fight notes for a boss, by the name a seed shows; undefined when the data has none. */
  bossNotes: (name: string): string | undefined => notes[name],
  /** The castle's points on this earth's map; undefined where there is no castle (Noklateo, Great Hollow). */
  castleOf: (earth: EarthId): CastlePoints | undefined => (earth === 'noklateo' || earth === 'great-hollow' ? undefined : data.maps.limveld.castle),
  nightlordWeakness: (id: NightlordId): Weakness => weaknesses.nightlords[id],
  /** By the night boss name a seed shows; undefined when there is no trustworthy data (never guessed). */
  nightBossWeakness: (name: string): Weakness | undefined => weaknesses.bosses[name],
  slotsOf: (earth: EarthId) => data.maps[mapFamily(earth)].slots as Record<SlotId, { x: number; y: number }>,
}
