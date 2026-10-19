// Derives the one-line answer from a fight's per-form numbers.
//
// This used to be hand-merged into the dataset alongside the forms. It was wrong
// twice in the same way: Nameless King is poison-immune in phase 2 and Crucible
// Knight's hippo is sleep-immune, and both merges took the other form's number
// and printed a status that never procs. Immunity does not average out, so the
// merge is code now and the dataset only holds what a source page states.
import type { DamageKey, Form, NightBoss, Status, StatusKey } from "./types";

const DAMAGE: DamageKey[] = [
  "standard",
  "slash",
  "strike",
  "pierce",
  "magic",
  "fire",
  "lightning",
  "holy",
];
const STATUSES: StatusKey[] = ["bleed", "frost", "rot", "poison", "sleep", "madness"];

export const neg = (f: Form, k: DamageKey): number =>
  k === "standard" || k === "slash" || k === "strike" || k === "pierce" ? f.phys[k] : f.elem[k];

export type Summary = {
  /** Worst case across every form: the number you can count on all fight. */
  neg: Record<DamageKey, number>;
  status: Record<StatusKey, Status>;
  /** Damage types tied at the best worst-case negation. Empty if none is negative. */
  weaknesses: DamageKey[];
  weaknessValue: number | null;
  fastestStatuses: StatusKey[];
  fastestStatusValue: number | null;
  /**
   * A weakness that only one form has, so the worst case cancels it. Named now
   * that the dataset labels its forms — "one phase only" was all we could say
   * when the forms were just block order off a wiki page.
   */
  formOnly: { label: string | null; value: number; keys: DamageKey[] } | null;
  formCount: number;
};

export function summarize(forms: Form[]): Summary {
  const worstNeg = {} as Record<DamageKey, number>;
  for (const k of DAMAGE) worstNeg[k] = Math.max(...forms.map((f) => neg(f, k)));

  // One immune form makes the status useless for the fight, whatever the others say.
  const worstStatus = {} as Record<StatusKey, Status>;
  for (const k of STATUSES) {
    const vals = forms.map((f) => f.status[k]);
    worstStatus[k] = vals.some((v) => v === "Immune")
      ? "Immune"
      : Math.max(...(vals as number[]));
  }

  // Ties are alphabetical rather than in declaration order: several fights have
  // four statuses at the same value and the row reads as an arbitrary jumble
  // otherwise.
  const best = Math.min(...DAMAGE.map((k) => worstNeg[k]));
  const weaknesses = best < 0 ? DAMAGE.filter((k) => worstNeg[k] === best).sort() : [];

  const procs = STATUSES.filter((k) => worstStatus[k] !== "Immune") as StatusKey[];
  const fastest = procs.length ? Math.min(...procs.map((k) => worstStatus[k] as number)) : null;

  return {
    neg: worstNeg,
    status: worstStatus,
    weaknesses,
    weaknessValue: weaknesses.length ? best : null,
    fastestStatuses: fastest === null ? [] : procs.filter((k) => worstStatus[k] === fastest).sort(),
    fastestStatusValue: fastest,
    formOnly: weaknesses.length ? null : singleFormWeakness(forms),
    formCount: forms.length,
  };
}

/**
 * Same summary, memoised. Every night list on an expedition page asks for one
 * per row, and the answer only depends on data that never changes at runtime.
 */
const cache = new WeakMap<Form[], Summary>();
export function summaryOf(boss: NightBoss): Summary | null {
  if (!boss.data) return null;
  let s = cache.get(boss.data.forms);
  if (!s) cache.set(boss.data.forms, (s = summarize(boss.data.forms)));
  return s;
}

/** The deepest negative negation any single form has, once the worst case has none. */
function singleFormWeakness(forms: Form[]): Summary["formOnly"] {
  if (forms.length < 2) return null;
  let best: { label: string | null; value: number; keys: DamageKey[] } | null = null;
  for (const f of forms) {
    const value = Math.min(...DAMAGE.map((k) => neg(f, k)));
    if (value >= 0 || (best && value >= best.value)) continue;
    best = { label: f.label, value, keys: DAMAGE.filter((k) => neg(f, k) === value).sort() };
  }
  return best;
}
