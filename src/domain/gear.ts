import { assess } from '../bestiary/assess'
import { bestiary, nightlordHeadline } from '../bestiary/bestiary'
import type { Affliction } from '../bestiary/enemy'
import { splitStructure, type ElementId, type SlotId } from './names'
import type { Seed } from './seed'

/** A camp's element is the element of the weapon its boss drops. Blight has no matching weakness. */
const ELEMENT_AFFLICTION: Record<ElementId, Affliction | null> = {
  fire: 'fire', holy: 'holy', magic: 'magic', lightning: 'lightning', frostbite: 'frost', poison: 'poison',
  bleed: 'bleed', blight: null, madness: 'madness', sleep: 'sleep', rot: 'rot',
}

/** What the run's two hardest fights, the Night 2 boss and the Nightlord, are weak to. */
export function wantedAfflictions(seed: Seed): Set<Affliction> {
  const wanted = new Set<Affliction>()
  const nightlord = bestiary.nightlord(seed.nightlord)
  if (nightlord) {
    const h = nightlordHeadline(nightlord)
    for (const k of [...h.weak, ...h.status]) wanted.add(k)
  }
  const nightTwo = bestiary.nightBoss(seed.nights[2].boss)
  if (nightTwo?.forms.length) for (const k of assess(nightTwo.forms).weakTo) wanted.add(k)
  return wanted
}

/** The camps whose dropped weapon hits what the run's hardest fights are weak to, and the afflictions they cover. */
export function gearForTheRun(seed: Seed): { camps: SlotId[]; afflictions: Affliction[] } {
  const wanted = wantedAfflictions(seed)
  const camps: SlotId[] = []
  const afflictions = new Set<Affliction>()
  for (const [slot, key] of Object.entries(seed.slots)) {
    const element = key ? splitStructure(key).element : null
    const affliction = element ? ELEMENT_AFFLICTION[element] : null
    if (!affliction || !wanted.has(affliction)) continue
    camps.push(slot)
    afflictions.add(affliction)
  }
  return { camps, afflictions: [...afflictions].sort() }
}
