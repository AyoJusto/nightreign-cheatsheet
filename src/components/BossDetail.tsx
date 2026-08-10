import type { Expedition } from "../types";
import { BY_NAME } from "../search";
import { FormBlock } from "./FormBlock";
import { WeaknessCallout } from "./WeaknessCallout";
import { WeaknessLine } from "./NightBossCard";

/**
 * The night bosses you might draw, each showing what it is weak to and linking
 * to its own page. Knowing the Nightlord is only half of a run.
 */
function NightList({
  n,
  bosses,
  onSelect,
}: {
  n: 1 | 2;
  bosses: string[];
  onSelect: (hash: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold">
        Night {n}
        <span className="ml-2 normal-case tracking-normal text-dim">{bosses.length} possible</span>
      </h3>
      <ul className="space-y-1.5">
        {bosses.map((name) => {
          const boss = BY_NAME.get(name);
          return (
            <li key={name}>
              <button
                type="button"
                disabled={!boss}
                onClick={() => boss && onSelect(`boss/${boss.slug}`)}
                className="flex min-h-11 w-full flex-col items-start justify-center gap-0.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors enabled:hover:border-ink-500 enabled:hover:bg-ink-700/70 disabled:cursor-default"
              >
                <span className="text-[13px] text-bone">{name}</span>
                {boss && <WeaknessLine boss={boss} size={15} />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BossDetail({
  e,
  onSelect,
}: {
  e: Expedition;
  onSelect: (hash: string) => void;
}) {
  return (
    <article className="w-full px-4 pb-24 pt-4 sm:px-6 lg:px-8 2xl:px-12">
      <header className="mb-6">
        <h1 className="display text-[clamp(1.75rem,5vw,3rem)] leading-[1.1] text-bone">
          {e.expedition}
        </h1>
        <div className="rule-gold mt-4 h-px" />
      </header>

      {/* Wide screens get the night lists as a real column rather than a slab
          dumped at the bottom of a narrow page. */}
      <div className="grid gap-x-10 gap-y-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-8">
          <WeaknessCallout e={e} />
          {e.forms.map((f, i) => (
            <FormBlock key={f.label ?? i} form={f} />
          ))}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-16 xl:self-start">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <NightList n={1} bosses={e.night1} onSelect={onSelect} />
            <NightList n={2} bosses={e.night2} onSelect={onSelect} />
          </div>

          <p className="border-t border-ink-600 pt-4 text-xs text-dim">
            Everdark Sovereign shares these weaknesses.
          </p>
        </aside>
      </div>
    </article>
  );
}
