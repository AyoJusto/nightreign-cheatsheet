import type { DamageKey, ElemKey, NightBoss, PhysKey, StatusKey } from "../types";
import { EXPEDITIONS } from "../data/nightlords";
import { Icon, LABELS, TINT } from "./Icon";
import { NightBadge } from "./NightBossCard";

const PHYS: PhysKey[] = ["standard", "slash", "strike", "pierce"];
const ELEM: ElemKey[] = ["magic", "fire", "lightning", "holy"];
const STATUS: StatusKey[] = ["bleed", "frost", "rot", "poison", "sleep", "madness"];

function Row({ k, v }: { k: DamageKey; v: number }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-ink-600/70 py-2 last:border-b-0">
      <Icon name={k} size={18} />
      <span className={`min-w-0 flex-1 truncate text-[13px] ${TINT[k] ?? "text-ash"}`}>
        {LABELS[k]}
      </span>
      <span
        className={`tnum shrink-0 text-right text-[15px] font-medium ${
          v < 0 ? "text-weak" : v > 0 ? "text-resist" : "text-dim"
        }`}
      >
        {v > 0 ? `+${v}` : v}
      </span>
    </div>
  );
}

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
  const inExpeditions = EXPEDITIONS.filter((e) => boss.expeditions.includes(e.id));

  const statuses = d
    ? [...STATUS].sort((a, b) => {
        const av = d.status[a];
        const bv = d.status[b];
        if (av === "Immune") return bv === "Immune" ? 0 : 1;
        if (bv === "Immune") return -1;
        return av - bv;
      })
    : [];

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

      {!d ? (
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
                {d.weaknesses.length || d.phaseOnly ? (
                  (d.weaknesses.length ? d.weaknesses : d.phaseOnly!.keys).map((k) => (
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
                {(d.weaknessValue ?? d.phaseOnly?.value) != null && (
                  <span className="tnum text-xl font-medium text-weak">
                    {d.weaknessValue ?? d.phaseOnly!.value}
                  </span>
                )}
              </div>

              {/* Which phase is not in the number, so it stays. The rest of the
                  sentence was restating it. */}
              {d.phaseOnly && !d.weaknesses.length && (
                <p className="mt-2 text-sm text-dim">
                  Phase {d.phaseOnly.form} only; the other resists it
                </p>
              )}
            </div>

            {d.fastestStatuses.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-500/70 bg-ink-800/50 px-5 py-3 sm:px-6">
                <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dim">
                  Fastest status
                </span>
                {d.fastestStatuses.map((k) => (
                  <span key={k} className="flex items-center gap-1.5">
                    <Icon name={k} size={20} />
                    <span className="text-sm text-ash">{LABELS[k]}</span>
                  </span>
                ))}
                <span className="tnum text-sm text-weak">{d.fastestStatusValue}</span>
              </div>
            )}

            {d.formCount > 1 && (
              <p className="border-t border-ink-500/70 bg-ink-800/60 px-5 py-2 text-xs text-dim sm:px-6">
                Worst case of {d.formCount} forms
              </p>
            )}
          </section>

          <div className="mt-8 grid gap-x-8 gap-y-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr))]">
            <div className="max-w-[22rem]">
              <Heading>Physical</Heading>
              {PHYS.map((k) => (
                <Row key={k} k={k} v={d.neg[k]} />
              ))}
            </div>
            <div className="max-w-[22rem]">
              <Heading>Elemental</Heading>
              {ELEM.map((k) => (
                <Row key={k} k={k} v={d.neg[k]} />
              ))}
            </div>
            <div className="sm:[grid-column:span_2]">
              <Heading>
                Status buildup{" "}
                <span className="normal-case tracking-normal text-dim">lower = faster</span>
              </Heading>
              <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11rem),1fr))]">
                {statuses.map((k) => {
                  const v = d.status[k];
                  const immune = v === "Immune";
                  return (
                    <div
                      key={k}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                        immune
                          ? "border-ink-600 bg-ink-800/50 opacity-55"
                          : "border-ink-500 bg-ink-700"
                      }`}
                    >
                      <Icon name={k} size={18} />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ash">
                        {LABELS[k]}
                      </span>
                      <span
                        className={`tnum text-[13px] font-medium ${
                          immune ? "text-dim" : v <= 154 ? "text-weak" : "text-bone"
                        }`}
                      >
                        {v}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
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
