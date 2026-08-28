export type PhysKey = "standard" | "slash" | "strike" | "pierce";
export type ElemKey = "magic" | "fire" | "lightning" | "holy";
export type DamageKey = PhysKey | ElemKey;
export type StatusKey = "bleed" | "frost" | "rot" | "poison" | "sleep" | "madness";
export type IconKey = DamageKey | StatusKey;

/** Buildup threshold. Lower procs faster. "Immune" never procs. */
export type Status = number | "Immune";

export type Form = {
  /** null when the fight has a single stat block. */
  label: string | null;
  hp: { solo: number; duo: number; trio: number } | null;
  /** null on night bosses — the wiki lists it, we have not transcribed it. */
  poise: number | null;
  /** Percentage negation. NEGATIVE means the boss takes MORE damage. */
  phys: Record<PhysKey, number>;
  elem: Record<ElemKey, number>;
  status: Record<StatusKey, Status>;
};

/**
 * The weakness the game and the guides actually list, which is the headline.
 * Curated rather than derived — deriving it disagrees with the game on Adel
 * (no damage type is negative, but Poison is the listed answer) and Harmonia
 * (a -10 strike outranks the Sleep everyone uses). `derived` is true only for
 * Dreglord, which no source lists.
 */
export type Listed = {
  key: IconKey;
  kind: "damage" | "status";
  value: number;
  derived: boolean;
};

export type Expedition = {
  id: string;
  expedition: string;
  nightlord: string;
  listed: Listed;
  /**
   * Every damage type tied at the best (lowest) worst-case negation. Empty when
   * the boss has no damage-type weakness at all — Adel soaks everything at 0 or
   * better, and naming a "weakness" of +0 would be a lie of emphasis.
   */
  weaknesses: DamageKey[];
  weaknessValue: number | null;
  /** Every status tied at the fastest buildup. Adel has four at 154. */
  fastestStatuses: StatusKey[];
  fastestStatusValue: number | null;
  forms: Form[];
  night1: string[];
  night2: string[];
};

export type Night = 1 | 2;

/**
 * A Night 1 or Night 2 boss. `data` is null when no trustworthy source exists.
 *
 * Only the per-form numbers are stored; the worst case and the headline weakness
 * come from `summarize()`. Storing both let them disagree, and they did.
 */
export type NightBoss = {
  slug: string;
  name: string;
  night: Night;
  /** Expedition ids this boss can appear in. */
  expeditions: string[];
  note?: string;
  data: {
    /** One entry per phase or per simultaneous enemy, labelled as the wiki labels it. */
    forms: Form[];
    /** Set when a duo's wiki page only gives numbers for one of the two. */
    source: string | null;
  } | null;
};

/** A search hit. Always one row per expedition, never one per matched boss. */
export type Hit = {
  expedition: Expedition;
  /** The query matched the Nightlord or expedition name itself. */
  nameMatch: boolean;
  /** Night bosses in this expedition that matched the query. */
  via: { boss: string; night: Night }[];
};

/** Search returns both kinds of thing: where you are, and what you are fighting. */
export type Results = {
  expeditions: Hit[];
  nightBosses: NightBoss[];
};

/** Which of the two effect pages a row lives on. */
export type EffectGroup = "relics" | "weapons";

/**
 * Where the effect comes from. Deep of Night has its own pool of both relic and
 * weapon effects, and dormant powers are a third weapon pool with their own
 * numbers — 13 titles exist in more than one of them, which is exactly why the
 * pools share a page instead of each getting their own.
 */
export type EffectPool = "base" | "deep" | "dormant";

export type Effect = {
  group: EffectGroup;
  pool: EffectPool;
  /** The sheet's Category column. A list because three rows are "Offensive/Defensive". */
  cats: string[];
  /**
   * Verbatim from "Stackable with self?", ragged answers included: "Yes", "No",
   * "N/A", "See Notes", "Yes?", "-", or "" when the sheet left it blank. Kept as
   * the source wrote it — flattening 26 uncertain rows into a Yes or a No would
   * invent an answer for the one question people open this page to ask.
   */
  stack: string;
  /** The text the game shows. The only thing search matches, alongside `keywords`. */
  title: string;
  /** What it actually does. Never indexed: it is the answer, not the question. */
  effect: string;
  notes?: string;
  /** Never displayed. Search-only — see the note on the index in effects.ts. */
  keywords?: string;
};

/**
 * One recommended effect on one relic.
 *
 * `effect` is the canonical title from data/effects.ts, which is what makes the
 * description lookup possible at all — the source spreadsheet writes the same
 * effect a dozen different ways. `as` carries the spreadsheet's own wording when
 * that wording says something the canonical title does not: the effect is
 * "Improved [Spell School] Sorcery/Incantation", the advice is "Improved Carian
 * Sword Sorcery", and only one of those tells you what to look for.
 */
export type BuildLine = {
  effect: string;
  as?: string;
  /** Drawbacks the effect drags along. Deep relic effects can carry two. */
  curses?: string[];
};

/**
 * One relic. `label` is either the relic's name or, when two slots share `n`,
 * the name of the variant — the spreadsheet uses one syntax for both and they
 * are told apart by whether they collide.
 */
export type BuildSlot = {
  n: 1 | 2 | 3;
  label?: string;
  /** Three, or four where the sheet offered a choice between two effects. */
  lines: BuildLine[];
};

/** Relics and depth relics are separate loadouts: depth only applies in Deep of Night. */
export type Build = {
  name: string;
  relics: BuildSlot[];
  deep: BuildSlot[];
};

export type CharacterBuilds = {
  slug: string;
  name: string;
  builds: Build[];
};
