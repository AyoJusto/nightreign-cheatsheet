import type { Expedition } from "../types";
import { Icon, LABELS, TINT } from "./Icon";

/** Buildup thresholds are unsigned; negation always shows its sign. */
function fmt(kind: "damage" | "status", v: number) {
  return kind === "damage" ? `${v > 0 ? "+" : ""}${v}` : `${v}`;
}

/**
 * The reason the page exists. Someone glancing at a second monitor for five
 * seconds reads this and nothing else, so it gets the most weight on the page
 * and it says what the game says.
 */
export function WeaknessCallout({ e }: { e: Expedition }) {
  const { listed } = e;

  // The supporting line is whichever lever the headline is not: a listed damage
  // type pairs with the fastest status, a listed status pairs with the best
  // damage type. Tied entries are all shown rather than picked between.
  const alsoStatuses = listed.kind === "damage" ? e.fastestStatuses : [];
  const alsoDamage = listed.kind === "status" ? e.weaknesses : [];

  return (
    <section className="overflow-hidden rounded-2xl border border-gold-dim/40 bg-gradient-to-b from-ink-600 to-ink-700">
      <div className="p-5 sm:p-6">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold">
          Weak to
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Icon name={listed.key} size={40} />
          <span
            className={`display text-[clamp(1.75rem,6vw,2.5rem)] leading-none ${
              TINT[listed.key] ?? "text-bone"
            }`}
          >
            {LABELS[listed.key]}
          </span>
          <span className="tnum text-xl font-medium text-weak">
            {fmt(listed.kind, listed.value)}
          </span>
        </div>

        {/* No prose restating the number. The only thing worth saying here is
            the thing the number cannot say: that nobody actually lists a
            weakness for this boss and it was computed from its own table. */}
        {listed.derived && (
          <p className="mt-2 text-sm text-dim">Not listed anywhere; taken from its own table.</p>
        )}
      </div>

      {(alsoStatuses.length > 0 || alsoDamage.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-500/70 bg-ink-800/50 px-5 py-3 sm:px-6">
          <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dim">
            Also
          </span>

          {alsoStatuses.map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <Icon name={k} size={20} />
              <span className="text-sm text-ash">{LABELS[k]}</span>
              <span className="tnum text-sm text-weak">{e.fastestStatusValue}</span>
            </span>
          ))}

          {alsoDamage.map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <Icon name={k} size={20} />
              <span className={`text-sm ${TINT[k] ?? "text-ash"}`}>{LABELS[k]}</span>
              <span className="tnum text-sm text-weak">{e.weaknessValue}</span>
            </span>
          ))}
        </div>
      )}

      {/* Kept, shortened to a tag. Without it -35 looks wrong next to Gnoster's
          -40 in the table below, and the reason is not derivable from either. */}
      {e.forms.length > 1 && (
        <p className="border-t border-ink-500/70 bg-ink-800/60 px-5 py-2 text-xs text-dim sm:px-6">
          Worst case of {e.forms.length} forms
        </p>
      )}
    </section>
  );
}
