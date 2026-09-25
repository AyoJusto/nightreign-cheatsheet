import data from './seeds.json'
import islands from './islands.json'
import type { Box, CastlePoints, Seed } from '../domain/seed'
import { EARTHS, mapFamily, type EarthId, type NightlordId, type SlotId, type Weakness } from '../domain/names'

const all = data.seeds as unknown as Seed[]
const byId = new Map(all.map((s) => [s.id, s]))
const weaknesses = data.weaknesses as { nightlords: Record<NightlordId, Weakness>; bosses: Record<string, Weakness> }

export const catalog = {
  all,
  seed: (id: string) => byId.get(id),
  seedsFor: (nightlord: NightlordId, earth: EarthId) => all.filter((s) => s.nightlord === nightlord && s.earth === earth),
  earthsFor: (nightlord: NightlordId) =>
    EARTHS.map((e) => e.id).filter((earth) => all.some((s) => s.nightlord === nightlord && s.earth === earth)),
  /** The castle's points on this earth's map; undefined where there is no castle (Noklateo, Great Hollow). */
  castleOf: (earth: EarthId): CastlePoints | undefined => (earth === 'noklateo' || earth === 'great-hollow' ? undefined : data.maps.limveld.castle),
  nightlordWeakness: (id: NightlordId): Weakness => weaknesses.nightlords[id],
  /** By the night boss name a seed shows; undefined when there is no trustworthy data (never guessed). */
  nightBossWeakness: (name: string): Weakness | undefined => weaknesses.bosses[name],
  /** The island's box on this earth's map (map units), as the keyed map draws it (scripts/import-seeds.ts). */
  islandOf: (earth: EarthId): Box => islands[earth],
  slotsOf: (earth: EarthId) => data.maps[mapFamily(earth)].slots as Record<SlotId, { x: number; y: number }>,
}
