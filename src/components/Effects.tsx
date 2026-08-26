import { Fragment, useState } from "react";
import type { Effect, EffectGroup } from "../types";
import {
  GROUPS,
  GROUP_SHORT,
  POOL_TAG,
  applyFilter,
  byCategory,
  effectsIn,
  filtersFor,
  stackLabel,
} from "../effects";

/**
 * Same idea as the expedition grid, and the same one rule from 360px to 3440px.
 * The minimum is wider because an effect row carries a sentence rather than a
 * name: full width, a 1440px row left the stacking answer stranded 1300px from
 * the title it belongs to.
 *
 * items-start rather than stretch — a three-line row padded out to match a
 * six-line neighbour is a box of empty.
 */
const GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(min(100%,24rem),1fr))] items-start gap-2";

/**
 * Chrome offers no line-break opportunity at a slash, so a title like
 * "Improved Poison/Blood Loss/Sleep/Deathblight/Rot/Frost/Madness Resist" is one
 * token wider than the column, and break-word then splits it wherever it happens
 * to overflow — which rendered as "Mad" / "ness". A <wbr> after each slash lets
 * it break where a reader already sees a seam.
 */
function withBreaks(title: string) {
  const parts = title.split("/");
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <>
          /<wbr />
        </>
      )}
    </Fragment>
  ));
}

const TONE = {
  yes: "text-weak",
  no: "text-resist",
  unknown: "text-dim",
} as const;

/**
 * A third register, below the expedition card and the night boss card.
 *
 * Terminal on purpose: everything the sheet knows about a row is on it, so a tap
 * through to a page holding the same four fields would be a tap that answers
 * nothing. The pool tag and the stacking answer ride the title's baseline rather
 * than taking a row of their own — that row cost 29px to carry one word.
 */
export function EffectRow({ effect: e, showGroup = false }: { effect: Effect; showGroup?: boolean }) {
  const stack = stackLabel(e.stack);
  const tag = POOL_TAG[e.pool];

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-ink-600 bg-ink-800/60 px-3.5 py-3">
      <div className="flex items-baseline justify-between gap-2.5">
        <h3 className="min-w-0 break-words text-[15px] font-medium leading-[1.3] text-bone">
          {withBreaks(e.title)}
        </h3>
        <span className="flex shrink-0 items-baseline gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.08em]">
          {tag && <span className="text-dim">{tag}</span>}
          <span className={TONE[stack.tone]}>{stack.label}</span>
        </span>
      </div>

      {e.effect ? (
        <p className="whitespace-pre-line text-[13px] leading-[1.55] text-ash">
          {/* Only search mixes relics and weapons, so only search has to place a row. */}
          {showGroup && <span className="text-dim">{GROUP_SHORT[e.group]} &middot; </span>}
          {e.effect}
        </p>
      ) : (
        <p className="text-[13px] leading-[1.55] text-dim">No effect data in the sheet</p>
      )}

      {e.notes && <p className="text-xs leading-[1.55] text-dim">{e.notes}</p>}
    </li>
  );
}

/** How you reach the two effect pages when you have nothing to type. */
export function EffectsDirectory({ onSelect }: { onSelect: (hash: string) => void }) {
  return (
    <>
      <h2 className="mb-2 mt-7 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dim">
        Effects
      </h2>
      <ul className={GRID}>
        {GROUPS.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              onClick={() => onSelect(`effects/${g.id}`)}
              className="flex h-12 w-full items-center gap-2.5 rounded-xl border border-ink-600 bg-ink-800/60 pl-3.5 pr-3 text-left transition-colors hover:border-gold-dim/50 hover:bg-ink-700 focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim/60"
            >
              <span className="min-w-0 grow text-[15px] font-medium text-bone">{g.label}</span>
              <span className="tnum text-[13px] text-dim">{g.count}</span>
              <svg
                className="size-3.5 shrink-0 text-gold-dim"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="m8 4 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

const CAP = 5;

/**
 * Effects in the search results, capped. Uncapped is not an option: "attack"
 * matches 140 rows, which would bury the expedition you were actually looking for
 * under a wall of relic text.
 */
export function EffectsSection({ effects }: { effects: Effect[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? effects : effects.slice(0, CAP);

  return (
    <>
      <ul className={GRID}>
        {shown.map((e) => (
          <EffectRow key={`${e.group}-${e.pool}-${e.title}`} effect={e} showGroup />
        ))}
      </ul>
      {!all && effects.length > CAP && (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="mt-2 h-11 w-full rounded-xl border border-ink-600 bg-ink-800/40 text-[13px] text-gold hover:border-gold-dim/50 hover:text-bone focus:outline-none focus:ring-1 focus:ring-gold-dim/60"
        >
          Show all {effects.length} effects
        </button>
      )}
    </>
  );
}

/**
 * One page per group. Unfiltered it is grouped under the sheet's own categories;
 * a filter flattens it, because a single category needs no heading above itself.
 */
export function EffectsPage({ group }: { group: EffectGroup }) {
  const [filter, setFilter] = useState<string | null>(null);
  const all = effectsIn(group);
  const list = applyFilter(all, filter);
  const active = filter ? filtersFor(group).find((f) => f.key === filter) : null;

  return (
    <div className="w-full px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:px-8 2xl:px-12">
      <h1 className="display text-2xl leading-[1.15] text-bone">
        {group === "relics" ? "Relic effects" : "Weapon effects"}
      </h1>
      <p className="mt-1.5 text-xs text-dim">
        {active ? (
          <>
            <span className="tnum text-gold">{list.length}</span> of{" "}
            <span className="tnum">{all.length}</span> &middot; {active.label}
          </>
        ) : (
          <>
            <span className="tnum">{all.length}</span> effects &middot; base and Deep of Night
            together
          </>
        )}
      </p>

      <div className="rule-gold my-3.5 h-px" />

      {/* Categories and pools in one row. Single select, so tapping the active
          chip clears it and two filters can never disagree about what they mean. */}
      <div className="flex flex-wrap items-center gap-1.5">
        {filtersFor(group).map((f, i, arr) => (
          <div key={f.key} className="contents">
            {f.kind === "pool" && arr[i - 1]?.kind === "cat" && (
              <span aria-hidden className="mx-0.5 h-5 w-px self-center bg-ink-500" />
            )}
            <button
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(filter === f.key ? null : f.key)}
              className={`flex h-11 items-center gap-1.5 rounded-lg border px-3 text-[13px] transition-colors focus:outline-none focus:ring-1 focus:ring-gold-dim/60 ${
                filter === f.key
                  ? "border-gold-dim bg-gold-dim/15 text-gold"
                  : "border-ink-500 bg-ink-800 text-ash hover:border-gold-dim/50"
              }`}
            >
              {f.label}
              <span className={`tnum ${filter === f.key ? "text-gold-dim" : "text-dim"}`}>
                {f.count}
              </span>
            </button>
          </div>
        ))}
      </div>

      {filter ? (
        <ul className={`mt-4 ${GRID}`}>
          {list.map((e) => (
            <EffectRow key={`${e.pool}-${e.title}`} effect={e} />
          ))}
        </ul>
      ) : (
        byCategory(list).map(({ cat, items }) => (
          <div key={cat}>
            <h2 className="mb-2 mt-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dim">
              {cat}
            </h2>
            <ul className={GRID}>
              {items.map((e) => (
                <EffectRow key={`${e.pool}-${e.title}`} effect={e} />
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
