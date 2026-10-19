import type { BuildSlot, CharacterBuilds, Effect } from "./types";
import { BUILDS } from "./data/builds";
import { EFFECTS } from "./data/effects";

export { BUILDS };

export const BY_CHARACTER = new Map<string, CharacterBuilds>(BUILDS.map((c) => [c.slug, c]));

/**
 * Titles are unique within the relic group — all 194 of them — so a build line
 * naming one names exactly one row. Weapon effects are excluded rather than
 * merely lost to the tiebreak: 30 titles live in both groups with different
 * numbers, and a relic loadout that quoted the weapon column would be wrong in a
 * way nobody reading it could see.
 */
const RELIC_EFFECTS = new Map<string, Effect>(
  EFFECTS.filter((e) => e.group === "relics").map((e) => [e.title, e]),
);

export function describe(title: string): Effect | undefined {
  return RELIC_EFFECTS.get(title);
}

/** Whether a title names a real relic effect. The test's whole job. */
export const isRelicEffect = (title: string) => RELIC_EFFECTS.has(title);

/**
 * Slots regrouped by number, so slot 3 offering two ways to be filled arrives as
 * one entry with two options rather than as two cards claiming the same number.
 */
export type SlotGroup = { n: 1 | 2 | 3; options: BuildSlot[] };

export function groupSlots(slots: BuildSlot[]): SlotGroup[] {
  const groups: SlotGroup[] = [];
  for (const s of slots) {
    const found = groups.find((g) => g.n === s.n);
    if (found) found.options.push(s);
    else groups.push({ n: s.n, options: [s] });
  }
  return groups;
}
