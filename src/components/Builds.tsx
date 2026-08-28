import { useState } from "react";
import type { Build, BuildLine, BuildSlot } from "../types";
import { BUILDS, BY_CHARACTER, describe, groupSlots } from "../builds";
import { withBreaks } from "./Effects";

/** Same one rule as every other grid here: columns come from width, not breakpoints. */
const CARD_GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-3";

/**
 * A recommended effect, and what it actually does.
 *
 * The description is hidden until asked for rather than printed inline. A
 * loadout is nine lines of advice; nine paragraphs of mechanics underneath them
 * is a wall, and the reader came here for the shopping list. It expands in place
 * instead of linking to the effects page, because losing your position halfway
 * down a loadout to read one line is the tap nobody makes twice.
 */
function Line({ line, open, onToggle }: { line: BuildLine; open: boolean; onToggle: () => void }) {
  const effect = describe(line.effect);
  const curses = (line.curses ?? []).map((c) => ({ title: c, effect: describe(c) }));

  return (
    <li className="border-t border-ink-600/70 first:border-t-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-h-11 w-full items-start gap-2 py-1.5 text-left focus:outline-none focus:ring-1 focus:ring-gold-dim/60"
      >
        <svg
          className={`mt-[0.3rem] size-3 shrink-0 text-gold-dim transition-transform ${open ? "rotate-90" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          aria-hidden
        >
          <path d="m8 4 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="min-w-0 self-center text-[13px] leading-[1.45] text-bone">
          {withBreaks(line.as ?? line.effect)}
        </span>
      </button>

      {open && (
        <p className="mb-2 ml-5 text-xs leading-[1.55] text-ash">
          {effect?.effect || "No effect data in the sheet"}
        </p>
      )}

      {/* A curse is the price of the effect above it, so it is indented under
          that effect rather than listed as a fourth thing on the relic. */}
      {curses.map((c) => (
        <p key={c.title} className="mb-1.5 ml-5 text-xs leading-[1.45] text-resist">
          {withBreaks(c.title)}
          {open && c.effect?.effect && (
            <span className="mt-0.5 block text-dim">{c.effect.effect}</span>
          )}
        </p>
      ))}
    </li>
  );
}

function Slot({ slot, keyBase }: { slot: BuildSlot; keyBase: string }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });

  return (
    <ul className="px-3.5 pb-2">
      {slot.lines.map((line, i) => (
        <Line
          key={`${keyBase}-${i}`}
          line={line}
          open={open.has(i)}
          onToggle={() => toggle(i)}
        />
      ))}
    </ul>
  );
}

/**
 * One relic slot, and its variants where the sheet gave more than one way to
 * fill it. Variants swap only this card — the other two slots of the build are
 * the same either way, which is the whole reason they are a toggle here rather
 * than two separate builds in the chip row.
 */
function SlotCard({ n, options, label }: { n: number; options: BuildSlot[]; label: string }) {
  const [pick, setPick] = useState(0);
  const slot = options[Math.min(pick, options.length - 1)]!;
  const variants = options.length > 1;

  return (
    <li className="rounded-xl border border-ink-600 bg-ink-800/60">
      <div className="flex items-baseline justify-between gap-2 px-3.5 pb-1.5 pt-3">
        <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gold-dim">
          {label} {n}
        </h4>
        {!variants && slot.label && (
          <span className="min-w-0 truncate text-xs text-dim">{slot.label}</span>
        )}
      </div>

      {variants && (
        <div className="flex flex-wrap gap-1.5 px-3.5 pb-1">
          {options.map((o, i) => (
            <button
              key={o.label ?? i}
              type="button"
              aria-pressed={pick === i}
              onClick={() => setPick(i)}
              className={`flex min-h-11 items-center rounded-lg border px-2.5 text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-gold-dim/60 ${
                pick === i
                  ? "border-gold-dim bg-gold-dim/15 text-gold"
                  : "border-ink-500 bg-ink-800 text-ash hover:border-gold-dim/50"
              }`}
            >
              {o.label ?? `Option ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Keyed on the variant so switching resets which lines are expanded —
          they describe different effects and carrying the old open rows over
          expands whatever happens to sit at the same index. */}
      <Slot key={slot.label ?? "only"} slot={slot} keyBase={`${label}-${n}`} />
    </li>
  );
}

function Column({ title, slots, label }: { title: string; slots: BuildSlot[]; label: string }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-bone">
        {title}
      </h3>
      <ul className="flex flex-col gap-2.5">
        {groupSlots(slots).map((g) => (
          <SlotCard key={g.n} n={g.n} options={g.options} label={label} />
        ))}
      </ul>
    </section>
  );
}

function BuildView({ build }: { build: Build }) {
  return (
    <section className="mt-5 grid gap-6 lg:grid-cols-2 lg:gap-8">
      <Column title="Relics" slots={build.relics} label="Relic" />
      <Column title="Depth relics" slots={build.deep} label="Deep" />
    </section>
  );
}

/** How you reach a character's builds when you have nothing to type. */
export function BuildsDirectory({ onSelect }: { onSelect: (hash: string) => void }) {
  return (
    <>
      <h2 className="mb-2 mt-7 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dim">
        Builds
      </h2>
      <ul className={CARD_GRID}>
        {BUILDS.map((c) => (
          <li key={c.slug}>
            {/* Same row as the effect pages above it. A name is the whole
                control: the build names belong on the page you land on, where
                they are the chips you choose between. */}
            <button
              type="button"
              onClick={() => onSelect(`builds/${c.slug}`)}
              className="flex h-12 w-full items-center gap-2.5 rounded-xl border border-ink-600 bg-ink-800/60 pl-3.5 pr-3 text-left transition-colors hover:border-gold-dim/50 hover:bg-ink-700 focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim/60"
            >
              <span className="min-w-0 grow text-[15px] font-medium text-bone">{c.name}</span>
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

/**
 * One Nightfarer. Builds are chips rather than a dropdown: nobody has more than
 * five, and a menu that hides four options costs a tap to find out what they are.
 */
export function BuildsPage({ slug }: { slug: string }) {
  const character = BY_CHARACTER.get(slug)!;
  const [pick, setPick] = useState(0);
  const build = character.builds[Math.min(pick, character.builds.length - 1)]!;

  return (
    <div className="w-full px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:px-8 2xl:px-12">
      <h1 className="display text-2xl leading-[1.15] text-bone">{character.name}</h1>

      <div className="rule-gold my-3.5 h-px" />

      <div className="flex flex-wrap items-center gap-1.5">
        {character.builds.map((b, i) => (
          <button
            key={b.name}
            type="button"
            aria-pressed={pick === i}
            onClick={() => setPick(i)}
            className={`flex h-11 items-center rounded-lg border px-3 text-[13px] transition-colors focus:outline-none focus:ring-1 focus:ring-gold-dim/60 ${
              pick === i
                ? "border-gold-dim bg-gold-dim/15 text-gold"
                : "border-ink-500 bg-ink-800 text-ash hover:border-gold-dim/50"
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Keyed on the build so the slot cards remount: their variant pick and
          expanded lines belong to the build that was showing, not to the next. */}
      <BuildView key={build.name} build={build} />
    </div>
  );
}
