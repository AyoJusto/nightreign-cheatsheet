import type { NightBoss } from "../types";
import { Icon, LABELS, TINT } from "./Icon";

/**
 * A fight with several health bars is either one enemy with phases or several
 * enemies at once, and the two need different words. Tree Sentinel & Royal
 * Cavalrymen is three enemies standing in a field; calling the third one
 * "phase 3" describes a fight that does not exist.
 *
 * The number is dropped either way. It is the order the blocks appeared on the
 * source page, which does not reliably map to a specific enemy or phase, so
 * naming one would be a guess dressed up as a fact.
 */
export function partialLabel(boss: NightBoss): string {
  return /\s&\s|\bDuo\b/.test(boss.name) ? "one target only" : "one phase only";
}

/**
 * The weakness summary that fits on one line — used on the search results and
 * on the expedition page's night lists. Says "no damage weakness" out loud
 * rather than showing nothing, because a blank space reads as missing data.
 */
export function WeaknessLine({ boss, size = 18 }: { boss: NightBoss; size?: number }) {
  const d = boss.data;
  if (!d) return <span className="text-[13px] text-dim">No reliable data</span>;

  if (d.weaknesses.length) {
    return (
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {d.weaknesses.map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <Icon name={k} size={size} />
            <span className={`text-[13px] ${TINT[k] ?? "text-bone"}`}>{LABELS[k]}</span>
          </span>
        ))}
        <span className="tnum text-[13px] text-weak">{d.weaknessValue}</span>
      </span>
    );
  }

  if (d.phaseOnly) {
    return (
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {d.phaseOnly.keys.map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <Icon name={k} size={size} />
            <span className={`text-[13px] ${TINT[k] ?? "text-bone"}`}>{LABELS[k]}</span>
          </span>
        ))}
        <span className="tnum text-[13px] text-weak">{d.phaseOnly.value}</span>
        <span className="text-[13px] text-dim">{partialLabel(boss)}</span>
      </span>
    );
  }

  if (d.fastestStatuses.length) {
    return (
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[13px] text-dim">No damage weakness ·</span>
        {d.fastestStatuses.slice(0, 2).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <Icon name={k} size={size} />
            <span className="text-[13px] text-ash">{LABELS[k]}</span>
          </span>
        ))}
        <span className="tnum text-[13px] text-weak">{d.fastestStatusValue}</span>
      </span>
    );
  }

  return <span className="text-[13px] text-dim">No weakness</span>;
}

export function NightBadge({ n }: { n: 1 | 2 }) {
  return (
    <span
      className={`shrink-0 rounded-md border px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wide ${
        n === 1
          ? "border-gold-dim/50 bg-gold-dim/10 text-gold"
          : "border-magic/40 bg-magic/10 text-magic"
      }`}
    >
      Night {n}
    </span>
  );
}

/**
 * Deliberately not shaped like an expedition card. An expedition is a place you
 * are in; a night boss is one encounter inside it. So expeditions sit raised on
 * the page with a serif name and a gold rule, and these sink into it: darker
 * than the ground, no outer border, name in the grotesque, and the night
 * carried by a coloured left edge instead of a pill.
 *
 * The pill is gone on purpose. On an expedition card it means "the boss you
 * searched is on night 1 there"; here it would mean "this boss is night 1".
 * One badge, two meanings, and the pair ended up looking identical.
 */
export function NightBossCard({
  boss,
  onSelect,
}: {
  boss: NightBoss;
  onSelect: (hash: string) => void;
}) {
  const n = boss.night;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(`boss/${boss.slug}`)}
        className={`flex h-full w-full flex-col gap-2 rounded-xl border-l-[3px] bg-ink-800/80 py-3 pl-3.5 pr-3 text-left shadow-[inset_0_1px_0_rgb(0_0_0/0.35)] transition-colors hover:bg-ink-700/80 focus:outline-none focus:ring-1 focus:ring-gold-dim/60 ${
          n === 1 ? "border-l-gold-dim/70" : "border-l-magic/60"
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="min-w-0 text-[15px] font-medium leading-tight text-bone">{boss.name}</h3>
          <span
            className={`shrink-0 text-[12px] font-semibold uppercase tracking-[0.14em] ${
              n === 1 ? "text-gold-dim" : "text-magic/80"
            }`}
          >
            N{n}
          </span>
        </div>
        <div className="mt-auto">
          <WeaknessLine boss={boss} size={16} />
        </div>
      </button>
    </li>
  );
}
