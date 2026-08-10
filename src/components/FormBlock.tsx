import type { DamageKey, ElemKey, Form, PhysKey, Status, StatusKey } from "../types";
import { Icon, LABELS, TINT } from "./Icon";

const PHYS: PhysKey[] = ["standard", "slash", "strike", "pierce"];
const ELEM: ElemKey[] = ["magic", "fire", "lightning", "holy"];
const STATUS: StatusKey[] = ["bleed", "frost", "rot", "poison", "sleep", "madness"];

function NegationRow({ k, v }: { k: DamageKey; v: number }) {
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

function statusTone(v: Status) {
  if (v === "Immune") return "text-dim";
  if (v <= 154) return "text-weak";
  if (v <= 252) return "text-bone";
  return "text-ash";
}

function StatusCell({ k, v }: { k: StatusKey; v: Status }) {
  const immune = v === "Immune";
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
        immune ? "border-ink-600 bg-ink-800/50 opacity-55" : "border-ink-500 bg-ink-700"
      }`}
    >
      <Icon name={k} size={18} />
      <span className="min-w-0 flex-1 truncate text-[13px] text-ash">{LABELS[k]}</span>
      <span className={`tnum text-[13px] font-medium ${statusTone(v)}`}>{v}</span>
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

export function FormBlock({ form }: { form: Form }) {
  // Fastest first, immune last: the ordering is the advice.
  const statuses = [...STATUS].sort((a, b) => {
    const av = form.status[a];
    const bv = form.status[b];
    if (av === "Immune") return bv === "Immune" ? 0 : 1;
    if (bv === "Immune") return -1;
    return av - bv;
  });

  return (
    <div className="space-y-5">
      {form.label && (
        <div className="flex items-center gap-3">
          <span className="display text-lg text-bone">{form.label}</span>
          <span className="rule-gold h-px flex-1" />
        </div>
      )}

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[13px] text-ash">
        {form.hp && (
          <span className="tnum">
            HP <span className="text-bone">{form.hp.solo.toLocaleString()}</span>
            <span className="text-dim"> solo</span>
            <span className="mx-1.5 text-ink-400">/</span>
            <span className="text-bone">{form.hp.duo.toLocaleString()}</span>
            <span className="text-dim"> duo</span>
            <span className="mx-1.5 text-ink-400">/</span>
            <span className="text-bone">{form.hp.trio.toLocaleString()}</span>
            <span className="text-dim"> trio</span>
          </span>
        )}
        <span className="tnum">
          Poise <span className="text-bone">{form.poise}</span>
        </span>
      </div>

      {/* Same auto-fit idea as the card grid. A negation column needs about
          13rem before the label and its number drift apart, so the row packs
          as many as fit and reflows on its own instead of at fixed breakpoints. */}
      <div className="grid gap-x-8 gap-y-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr))]">
        {/* The track can be wide; the row should not be. Letting these stretch
            on a big monitor puts a hand's width of empty between "Standard"
            and "-15", which is harder to read than a short row, not easier. */}
        <div className="max-w-[22rem]">
          <Heading>Physical</Heading>
          {PHYS.map((k) => (
            <NegationRow key={k} k={k} v={form.phys[k]} />
          ))}
        </div>
        <div className="max-w-[22rem]">
          <Heading>Elemental</Heading>
          {ELEM.map((k) => (
            <NegationRow key={k} k={k} v={form.elem[k]} />
          ))}
        </div>

        {/* Six status cells need roughly twice a negation column's width — but
            only once there are two tracks to span. Below 640px the grid is a
            single column, and spanning 2 there invents an implicit second
            column and scrolls the page sideways. */}
        <div className="sm:[grid-column:span_2]">
          {/* The direction is inverted and nothing on screen implies it, so it
              rides along in the heading instead of as a sentence underneath. */}
          <Heading>
            Status buildup <span className="normal-case tracking-normal text-dim">lower = faster</span>
          </Heading>
          <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11rem),1fr))]">
            {statuses.map((k) => (
              <StatusCell key={k} k={k} v={form.status[k]} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
