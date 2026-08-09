import type { Expedition, Hit, Night } from "./types";
import { EXPEDITIONS } from "./data/nightlords";

/**
 * Fold to a comparable form. Apostrophes and ampersands are the two things a
 * player will not bother typing — "nights cavalry" has to find "Night's
 * Cavalry", and "tibia mariner and those who live in death" has to find the
 * "&" spelling.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    // Apostrophes are dropped, not spaced: nobody types "Night's", and turning
    // it into "night s" would fail to match the "nights" they do type.
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Every distinct night boss, for the type-ahead. */
export const ALL_BOSSES: { name: string; night: Night }[] = (() => {
  const seen = new Map<string, Night>();
  for (const e of EXPEDITIONS) {
    for (const b of e.night1) seen.set(b, 1);
    for (const b of e.night2) seen.set(b, 2);
  }
  return [...seen].map(([name, night]) => ({ name, night })).sort((a, b) => a.name.localeCompare(b.name));
})();

/**
 * One search box, one kind of result: expeditions.
 *
 * A query can land on the Nightlord's name, the expedition's name, or any night
 * boss inside it. All three answer the same question — which expedition is this —
 * so they share a result list rather than living in separate widgets.
 */
export function search(query: string, data: Expedition[] = EXPEDITIONS): Hit[] {
  const q = normalize(query);
  if (!q) return data.map((expedition) => ({ expedition, nameMatch: false, via: [] }));

  const hits: Hit[] = [];
  for (const expedition of data) {
    // The Nightlord's own name is no longer shown anywhere, but it stays
    // searchable: plenty of guides and voice comms say "Heolstor" or "Gladius",
    // and finding nothing for a name the game uses would be a worse tool.
    const nameMatch =
      normalize(expedition.nightlord).includes(q) || normalize(expedition.expedition).includes(q);

    // Collected per expedition, not per boss: searching "demon" hits both
    // Centipede Demon and Smelter Demon inside Sentient Pest, and that is one
    // row listing two bosses, not the same expedition twice.
    const via: { boss: string; night: Night }[] = [];
    for (const [night, list] of [
      [1, expedition.night1],
      [2, expedition.night2],
    ] as [Night, string[]][]) {
      for (const boss of list) {
        if (normalize(boss).includes(q)) via.push({ boss, night });
      }
    }

    if (nameMatch || via.length) hits.push({ expedition, nameMatch, via });
  }

  // Naming the Nightlord is a more specific intent than naming a boss it happens
  // to share with three other expeditions, so those surface first.
  return hits.sort((a, b) => Number(b.nameMatch) - Number(a.nameMatch));
}

/**
 * Night Aspect draws from nearly the whole boss pool, so it survives most
 * searches and can make the tool look broken. Worth saying out loud rather than
 * letting the user wonder why Heolstor is always in the list.
 */
export function nightAspectIsNoise(hits: Hit[]): boolean {
  return (
    hits.length > 1 &&
    hits.some((h) => h.expedition.id === "night-aspect" && !h.nameMatch && h.via.length > 0)
  );
}
