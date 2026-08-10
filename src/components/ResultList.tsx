import type { Hit, NightBoss } from "../types";
import { Icon, LABELS, TINT } from "./Icon";
import { NightBadge, NightBossCard } from "./NightBossCard";

function Card({ hit, onSelect }: { hit: Hit; onSelect: (id: string) => void }) {
  const { expedition: e, via } = hit;
  const nights = [...new Set(via.map((v) => v.night))].sort();

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(e.id)}
        className="group flex h-full w-full flex-col rounded-2xl border border-ink-600 bg-ink-700/70 p-4 text-left transition-colors hover:border-gold-dim/50 hover:bg-ink-600 focus:border-gold-dim focus:outline-none focus:ring-1 focus:ring-gold-dim/60"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="display min-w-0 text-xl leading-tight text-bone">{e.expedition}</h3>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {nights.map((n) => (
              <NightBadge key={n} n={n} />
            ))}
          </div>
        </div>

        {/* Why this row is in the results, when it was a night boss that matched. */}
        {via.length > 0 && (
          <p className="mt-2 text-xs leading-relaxed text-ash">{via.map((v) => v.boss).join(" · ")}</p>
        )}

        <div className="rule-gold my-3 h-px" />

        <div className="mt-auto flex items-center gap-2">
          <Icon name={e.listed.key} size={24} />
          <span className={`text-[15px] font-medium ${TINT[e.listed.key] ?? "text-bone"}`}>
            {LABELS[e.listed.key]}
          </span>
          <span className="tnum text-sm text-weak">
            {e.listed.kind === "damage" && e.listed.value > 0 ? "+" : ""}
            {e.listed.value}
          </span>
        </div>
      </button>
    </li>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dim first:mt-0">
      {children}
    </h2>
  );
}

// Columns are driven by available width, not by breakpoint guesses: a card
// needs about 17rem to hold a name and its weakness, so the grid fits as many
// as the window allows. One rule that works at 360px and at 3440px.
const GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-3";

export function ResultList({
  hits,
  nightBosses,
  onSelect,
  noise,
  searching,
}: {
  hits: Hit[];
  nightBosses: NightBoss[];
  onSelect: (id: string) => void;
  noise: boolean;
  searching: boolean;
}) {
  if (!hits.length && !nightBosses.length) {
    return (
      <p className="rounded-2xl border border-ink-600 bg-ink-700/50 px-4 py-8 text-center text-sm text-dim">
        No expedition or night boss by that name.
      </p>
    );
  }

  return (
    <>
      {/* Both kinds of answer, labelled, so "4 expeditions" and "the boss
          itself" are not mixed into one undifferentiated list. */}
      {nightBosses.length > 0 && (
        <>
          <SectionLabel>
            Night {nightBosses.length === 1 ? "boss" : "bosses"}
          </SectionLabel>
          <ul className={GRID}>
            {nightBosses.map((b) => (
              <NightBossCard key={b.slug} boss={b} onSelect={onSelect} />
            ))}
          </ul>
        </>
      )}

      {hits.length > 0 && (
        <>
          {searching && nightBosses.length > 0 && <SectionLabel>Expeditions</SectionLabel>}
          <ul className={GRID}>
            {hits.map((h) => (
              <Card key={h.expedition.id} hit={h} onSelect={onSelect} />
            ))}
          </ul>
        </>
      )}

      {noise && (
        <p className="mt-4 rounded-xl border border-ink-600 bg-ink-800/60 px-4 py-3 text-xs leading-relaxed text-dim">
          Night Aspect pulls from nearly every boss in the game, so it survives most searches. It is
          rarely the one you are actually in.
        </p>
      )}
    </>
  );
}
