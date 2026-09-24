import data from './seeds.json'
import type { Seed } from '../domain/seed'
import { EARTHS, mapFamily, type EarthId, type NightlordId, type SlotId } from '../domain/names'

const all = data.seeds as unknown as Seed[]
const byId = new Map(all.map((s) => [s.id, s]))

export const catalog = {
  all,
  seed: (id: string) => byId.get(id),
  seedsFor: (nightlord: NightlordId, earth: EarthId) => all.filter((s) => s.nightlord === nightlord && s.earth === earth),
  earthsFor: (nightlord: NightlordId) =>
    EARTHS.map((e) => e.id).filter((earth) => all.some((s) => s.nightlord === nightlord && s.earth === earth)),
  slotsOf: (earth: EarthId) => data.maps[mapFamily(earth)].slots as Record<SlotId, { x: number; y: number }>,
}
