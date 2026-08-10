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
  poise: number;
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

/** A Night 1 or Night 2 boss. `data` is null when no trustworthy source exists. */
export type NightBoss = {
  slug: string;
  name: string;
  night: Night;
  /** Expedition ids this boss can appear in. */
  expeditions: string[];
  note?: string;
  data: {
    weaknesses: DamageKey[];
    weaknessValue: number | null;
    /** A weakness that only holds for one phase, so the worst case cancels it. */
    phaseOnly: { keys: DamageKey[]; value: number; form: number } | null;
    fastestStatuses: StatusKey[];
    fastestStatusValue: number | null;
    formCount: number;
    neg: Record<DamageKey, number>;
    status: Record<StatusKey, Status>;
    /** Set when the numbers come from one half of a duo fight's wiki page. */
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
