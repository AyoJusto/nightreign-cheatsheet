import type { Expedition } from "../types";
import { FormBlock } from "./FormBlock";
import { WeaknessCallout } from "./WeaknessCallout";

function NightList({ n, bosses }: { n: 1 | 2; bosses: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold">
        Night {n}
        <span className="ml-2 normal-case tracking-normal text-dim">{bosses.length} possible</span>
      </h3>
      <ul className="space-y-1">
        {bosses.map((b) => (
          <li key={b} className="text-[13px] text-ash">
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BossDetail({ e }: { e: Expedition }) {
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
            <NightList n={1} bosses={e.night1} />
            <NightList n={2} bosses={e.night2} />
          </div>

          <p className="border-t border-ink-600 pt-4 text-xs leading-relaxed text-dim">
            The Everdark Sovereign version shares these weaknesses. It opens at phase two with
            extra attacks, so the damage type and status that work here still work there.
          </p>
        </aside>
      </div>
    </article>
  );
}
