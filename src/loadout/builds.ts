import type { BuildSlot, CharacterBuilds, Effect } from './loadout'
import { BUILDS } from './data/builds'
import { EFFECTS } from './data/effects'

export { BUILDS }

export const BY_CHARACTER = new Map<string, CharacterBuilds>(BUILDS.map((c) => [c.slug, c]))

// Weapon effects are left out: dozens of titles exist in both groups with
// different numbers, and a relic build quoting the weapon row would be silently wrong.
const RELIC_EFFECTS = new Map<string, Effect>(EFFECTS.filter((e) => e.group === 'relics').map((e) => [e.title, e]))

export const describe = (title: string): Effect | undefined => RELIC_EFFECTS.get(title)

export const isRelicEffect = (title: string): boolean => RELIC_EFFECTS.has(title)

export interface SlotGroup {
  n: 1 | 2 | 3
  options: BuildSlot[]
}

export function groupSlots(slots: BuildSlot[]): SlotGroup[] {
  const groups: SlotGroup[] = []
  for (const slot of slots) {
    const group = groups.find((g) => g.n === slot.n)
    if (group) group.options.push(slot)
    else groups.push({ n: slot.n, options: [slot] })
  }
  return groups
}
