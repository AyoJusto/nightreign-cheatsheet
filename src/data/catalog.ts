import data from './seeds.json'
import islands from './islands.json'
import type { Box, CastlePoints, Seed } from '../domain/seed'
import { EARTHS, NIGHTLORDS, mapFamily, type EarthId, type NightlordId, type NightlordPick, type SlotId } from '../domain/names'
import { bestiary } from '../bestiary/bestiary'
import type { Enemy } from '../bestiary/enemy'

const all = data.seeds as unknown as Seed[]
const byId = new Map(all.map((s) => [s.id, s]))
const picked = (nightlord: NightlordPick) => (s: Seed) => nightlord === 'unknown' || s.nightlord === nightlord

type Night = 1 | 2
const nightFights = (seeds: Seed[], night: Night) => {
  const ids = new Set(seeds.map((s) => bestiary.nightBoss(s.nights[night].boss)?.id).filter(Boolean))
  return [...ids].map((id) => bestiary.enemy(id!)!).sort((a, b) => a.name.localeCompare(b.name))
}

export const catalog = {
  all,
  seed: (id: string) => byId.get(id),
  seedsFor: (nightlord: NightlordPick, earth: EarthId) => all.filter((s) => picked(nightlord)(s) && s.earth === earth),
  earthsFor: (nightlord: NightlordPick) =>
    EARTHS.map((e) => e.id).filter((earth) => all.some((s) => picked(nightlord)(s) && s.earth === earth)),
  /** The castle's points on this earth's map; undefined where there is no castle (Noklateo, Great Hollow). */
  castleOf: (earth: EarthId): CastlePoints | undefined => (earth === 'noklateo' || earth === 'great-hollow' ? undefined : data.maps.limveld.castle),
  /** The island's box on this earth's map (map units), as the keyed map draws it (scripts/import-seeds.ts). */
  islandOf: (earth: EarthId): Box => islands[earth],
  nightBossesOf: (nightlord: NightlordId): Record<Night, Enemy[]> => {
    const seeds = all.filter((s) => s.nightlord === nightlord)
    return { 1: nightFights(seeds, 1), 2: nightFights(seeds, 2) }
  },
  /** Which Nightlords' runs a night boss closes a night in, in roster order. */
  nightsOf: (enemyId: string): { nightlord: NightlordId; nights: Night[] }[] =>
    NIGHTLORDS.map(({ id }) => ({
      nightlord: id,
      nights: ([1, 2] as const).filter((n) => all.some((s) => s.nightlord === id && bestiary.nightBoss(s.nights[n].boss)?.id === enemyId)),
    })).filter((e) => e.nights.length > 0),
  slotsOf: (earth: EarthId) => data.maps[mapFamily(earth)].slots as Record<SlotId, { x: number; y: number }>,
}
