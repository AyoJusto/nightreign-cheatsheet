import type { NightBoss } from "../types";
import { EXPEDITIONS } from "../data/nightlords";
import { summaryOf } from "../summary";
import { Icon, LABELS, TINT } from "./Icon";
import { FormBlock } from "./FormBlock";
import { NightBadge, partialLabel } from "./NightBossCard";

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold">
      {children}
    </h3>
  );
}

export function NightBossDetail({
  boss,
  onSelect,
}: {
  boss: NightBoss;
  onSelect: (hash: string) => void;
}) {
  const d = boss.data;
  const s = summaryOf(boss);
  const inExpeditions = EXPEDITIONS.filter((e) => boss.expeditions.includes(e.id));
  const multi = /\s&\s|\bDuo\b/.test(boss.name) ? "targets" : "phases";

  return (
    <article className="w-full px-4 pb-24 pt-4 sm:px-6 lg:px-8 2xl:px-12">
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="display text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.1] text-bone">
            {boss.name}
          </h1>
          <NightBadge n={boss.night} />
        </div>
        <div className="rule-gold mt-4 h-px" />
      </header>

      {!d || !s ? (
        <p className="rounded-2xl border border-ink-600 bg-ink-700/60 p-5 text-sm leading-relaxed text-ash">
          No trustworthy numbers for this one. The community wiki page for it is largely a copy of
          another boss's page, so importing it would have shown you the wrong weaknesses. Left
          blank on purpose rather than guessed.
        </p>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-gold-dim/40 bg-gradient-to-b from-ink-600 to-ink-700">
            <div className="p-5 sm:p-6">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold">
                Weak to
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {s.weaknesses.length || s.formOnly ? (
                  (s.weaknesses.length ? s.weaknesses : s.formOnly!.keys).map((k) => (
                    <span key={k} className="flex items-center gap-2">
                      <Icon name={k} size={34} />
                      <span
                        className={`display text-3xl leading-none ${TINT[k] ?? "text-bone"}`}
                      >
                        {LABELS[k]}
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="display text-3xl leading-none text-ash">
                    No damage weakness
                  </span>
                )}
                {(s.weaknessValue ?? s.formOnly?.value) != null && (
                  <span className="tnum text-xl font-medium text-weak">
                    {s.weaknessValue ?? s.formOnly!.value}
                  </span>
                )}
              </div>

              {/* Which one of them is weak to it is the whole point of the line,
                  and the blocks below are where you go to see by how much. */}
              {s.formOnly && !s.weaknesses.length && (
                <p className="mt-2 text-sm text-dim">
                  {s.formOnly.label ? `${s.formOnly.label} only` : partialLabel(boss)};{" "}
                  {s.formCount === 2 ? "the other resists it" : "the rest resist it"}
                </p>
              )}
            </div>

            {s.fastestStatuses.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-500/70 bg-ink-800/50 px-5 py-3 sm:px-6">
                <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dim">
                  Fastest status
                </span>
                {s.fastestStatuses.map((k) => (
                  <span key={k} className="flex items-center gap-1.5">
                    <Icon name={k} size={20} />
                    <span className="text-sm text-ash">{LABELS[k]}</span>
                  </span>
                ))}
                <span className="tnum text-sm text-weak">{s.fastestStatusValue}</span>
              </div>
            )}

            {s.formCount > 1 && (
              <p className="border-t border-ink-500/70 bg-ink-800/60 px-5 py-2 text-xs text-dim sm:px-6">
                Worst case of {s.formCount} {multi} — each one's own numbers are below
              </p>
            )}
          </section>

          {/* The summary above is what to bring; these are why. A single-form
              fight gets one unlabelled block, which is the same table it always
              showed. */}
          <div className="mt-8 space-y-8">
            {d.forms.map((f, i) => (
              <FormBlock key={f.label ?? i} form={f} />
            ))}
          </div>

          {/* Which of a duo the numbers describe is not visible anywhere else. */}
          {d.source && <p className="mt-6 text-xs text-dim">Numbers are for {d.source}</p>}
        </>
      )}

      <div className="mt-10">
        <Heading>Appears in</Heading>
        <ul className="mt-2 flex flex-wrap gap-2">
          {inExpeditions.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onSelect(e.id)}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-ink-600 bg-ink-700/70 px-3 text-[13px] text-ash transition-colors hover:border-gold-dim/50 hover:text-bone"
              >
                {e.expedition}
                <Icon name={e.listed.key} size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
