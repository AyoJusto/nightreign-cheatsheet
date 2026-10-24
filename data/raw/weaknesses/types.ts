export type PhysKey = "standard" | "slash" | "strike" | "pierce";
export type ElemKey = "magic" | "fire" | "lightning" | "holy";
export type DamageKey = PhysKey | ElemKey;
export type StatusKey = "bleed" | "frost" | "rot" | "poison" | "sleep" | "madness";
export type IconKey = DamageKey | StatusKey;

type BuildupNeededToProc = number;
export type Status = BuildupNeededToProc | "Immune";

export type Form = {
  label: string | null;
  hp: { solo: number; duo: number; trio: number } | null;
  poise: number | null;
  /** Percentage negation. NEGATIVE means the boss takes MORE damage. */
  phys: Record<PhysKey, number>;
  elem: Record<ElemKey, number>;
  status: Record<StatusKey, Status>;
};

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
  weaknesses: DamageKey[];
  weaknessValue: number | null;
  fastestStatuses: StatusKey[];
  fastestStatusValue: number | null;
  forms: Form[];
  night1: string[];
  night2: string[];
};

export type Night = 1 | 2;

export type NightBoss = {
  slug: string;
  name: string;
  night: Night;
  expeditions: Expedition["id"][];
  note?: string;
  data: {
    forms: Form[];
    source: string | null;
  } | null;
};

export type Hit = {
  expedition: Expedition;
  nameMatch: boolean;
  via: { boss: string; night: Night }[];
};

export type Results = {
  expeditions: Hit[];
  nightBosses: NightBoss[];
};

export type EffectGroup = "relics" | "weapons";

export type EffectPool = "base" | "deep" | "dormant";

export type Effect = {
  group: EffectGroup;
  pool: EffectPool;
  cats: string[];
  stack: string;
  title: string;
  effect: string;
  notes?: string;
  keywords?: string;
};

export type BuildLine = {
  effect: string;
  as?: string;
  curses?: string[];
};

export type BuildSlot = {
  n: 1 | 2 | 3;
  label?: string;
  lines: BuildLine[];
};

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
