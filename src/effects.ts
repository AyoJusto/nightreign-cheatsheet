import type { Effect, EffectGroup, EffectPool } from "./types";
import { EFFECTS } from "./data/effects";
import { normalize } from "./search";

/**
 * The search index is the title, plus keywords where the title alone fails.
 *
 * Not the effect text. The premise of the whole site is that you type what the
 * game showed you, and the effect column is the answer rather than the question —
 * indexing it makes "attack" match 162 of 378 rows instead of 140, and "stack"
 * match 31 rows whose titles never mention stacking.
 *
 * The game's wording is the wording, even when it is not the player's: nothing
 * in game says "bleed", so the four blood-loss rows are found by typing "blood".
 *
 * Built once at module load. Normalising every row on every keystroke measures
 * 0.6ms, which would have been fine; this is 0.02ms, which is free.
 */
const TITLES = EFFECTS.map((e) => normalize(e.title));
const KEYWORDS = EFFECTS.map((e) => (e.keywords ? normalize(e.keywords) : ""));

/**
 * Title matches first, keyword matches after.
 *
 * Both are real hits, but they are not equally on the nose. "blood" matches
 * "Power of the Blood Lord" outright, and it also matches every [Status] template
 * row because blood loss is one of the statuses those rows stand for. Left in
 * data order the templates come first, sit at the top of a capped list, and hide
 * the row the player was actually looking at.
 */
export function searchEffects(query: string): Effect[] {
  const q = normalize(query);
  if (!q) return [];
  const titled: Effect[] = [];
  const implied: Effect[] = [];
  EFFECTS.forEach((e, i) => {
    if (TITLES[i]!.includes(q)) titled.push(e);
    else if (KEYWORDS[i]!.includes(q)) implied.push(e);
  });
  return [...titled, ...implied];
}

/** The tag shown beside the stacking answer. Base rows carry none. */
export const POOL_TAG: Record<EffectPool, string | null> = {
  base: null,
  deep: "Deep",
  dormant: "Dormant",
};

const GROUP_LABEL: Record<EffectGroup, string> = {
  relics: "Relic effects",
  weapons: "Weapon effects",
};

/** Named where a row sits next to boss results and needs placing in one word. */
export const GROUP_SHORT: Record<EffectGroup, string> = {
  relics: "Relics",
  weapons: "Weapons",
};

export function effectsIn(group: EffectGroup): Effect[] {
  return EFFECTS.filter((e) => e.group === group);
}

/** The two destinations on the home screen. */
export const GROUPS: { id: EffectGroup; label: string; count: number }[] = (
  ["relics", "weapons"] as EffectGroup[]
).map((id) => ({ id, label: GROUP_LABEL[id], count: effectsIn(id).length }));

/**
 * One filter row per page, mixing the sheet's own categories with the pools.
 * Single select, so a filter is one string and there is never a question of what
 * two active filters mean together.
 */
export type Filter = { key: string; label: string; count: number; kind: "cat" | "pool" };

export function filtersFor(group: EffectGroup): Filter[] {
  const list = effectsIn(group);

  const cats = new Map<string, number>();
  // Counted against every category a row claims, so the Defensive chip finds the
  // rows the sheet filed as "Offensive/Defensive". Chip counts therefore sum to
  // more than the page total, which is correct rather than a bug.
  for (const e of list) for (const c of e.cats) cats.set(c, (cats.get(c) ?? 0) + 1);

  const pools = new Map<EffectPool, number>();
  for (const e of list) if (e.pool !== "base") pools.set(e.pool, (pools.get(e.pool) ?? 0) + 1);

  return [
    ...[...cats].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ key: `cat:${label}`, label, count, kind: "cat" as const })),
    ...[...pools].sort((a, b) => b[1] - a[1]).map(([pool, count]) => ({ key: `pool:${pool}`, label: POOL_TAG[pool]!, count, kind: "pool" as const })),
  ];
}

export function applyFilter(list: Effect[], key: string | null): Effect[] {
  if (!key) return list;
  const value = key.slice(key.indexOf(":") + 1);
  return key.startsWith("pool:")
    ? list.filter((e) => e.pool === value)
    : list.filter((e) => e.cats.includes(value));
}

/**
 * The unfiltered page, grouped under the sheet's categories.
 *
 * A row with two categories is filed under its first one only. Listing it twice
 * would make the page longer than the count in its own header, and a reader
 * scrolling past the same row in two places reads it as a duplicate rather than
 * as a row that is honestly both. Filtering still finds it under either.
 */
export function byCategory(list: Effect[]): { cat: string; items: Effect[] }[] {
  const groups = new Map<string, Effect[]>();
  for (const e of list) {
    const cat = e.cats[0] ?? "Other";
    const items = groups.get(cat);
    if (items) items.push(e);
    else groups.set(cat, [e]);
  }
  return [...groups]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([cat, items]) => ({ cat, items }));
}

export type StackTone = "yes" | "no" | "unknown";

/**
 * "Does it stack with itself" is the question this page exists to answer, so the
 * 26 rows where the sheet is not sure say so in their own words rather than being
 * rounded to the nearest lie.
 */
export function stackLabel(stack: string): { label: string; tone: StackTone } {
  if (stack === "Yes") return { label: "Stacks", tone: "yes" };
  if (stack === "No") return { label: "No stack", tone: "no" };
  if (!stack || stack === "-") return { label: "Unknown", tone: "unknown" };
  return { label: stack, tone: "unknown" };
}
