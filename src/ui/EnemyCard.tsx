import { assess } from '../bestiary/assess'
import type { Affliction, Enemy } from '../bestiary/enemy'
import { DAMAGE_NAMES } from '../domain/names'
import { Icon } from './Icon'

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

function Afflictions({ keys, value, tone }: { keys: Affliction[]; value?: (k: Affliction) => string; tone: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
      {keys.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <img src={`damage/${k}.webp`} alt="" className="size-5 rounded" draggable={false} />
          {DAMAGE_NAMES[k]}
          {value && <span className={`font-semibold tabular-nums ${tone}`}>{value(k)}</span>}
        </span>
      ))}
    </span>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] items-center gap-2 py-2 shadow-[inset_0_0.5px_0_var(--color-separator)] first:shadow-none">
      <dt className="text-[15px] text-label-2">{label}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  )
}

export function EnemyFacts({ enemy }: { enemy: Enemy }) {
  if (!enemy.forms.length) return <p className="m-0 py-2 text-label-2">No numbers for this one yet.</p>
  const verdict = assess(enemy.forms)
  const oneForm = verdict.oneForm
  return (
    <dl className="m-0 text-base">
      {verdict.weakTo.length > 0 && (
        <Row label="Weak"><Afflictions keys={verdict.weakTo} value={() => signed(verdict.weakBy!)} tone="text-weak" /></Row>
      )}
      {!verdict.weakTo.length && oneForm && (
        <Row label={oneForm.label ?? 'Weak'}><Afflictions keys={oneForm.weakTo} value={() => signed(oneForm.by)} tone="text-weak" /></Row>
      )}
      {verdict.resists.length > 0 && (
        <Row label="Resists"><Afflictions keys={verdict.resists} value={(k) => signed(verdict.negation[k as keyof typeof verdict.negation])} tone="text-label-2" /></Row>
      )}
      {verdict.fastest.length > 0 && (
        <Row label="Status"><Afflictions keys={verdict.fastest} value={() => String(verdict.fastestAt)} tone="text-weak" /></Row>
      )}
      {verdict.immuneTo.length > 0 && (
        <Row label="Immune"><span className="text-immune">{verdict.immuneTo.map((s) => DAMAGE_NAMES[s]).join(', ')}</span></Row>
      )}
    </dl>
  )
}

export function EnemyCardHeader({ enemy, onClose }: { enemy: Enemy; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="m-0 min-w-0 flex-1 text-[22px] leading-7 font-bold">{enemy.name}</h2>
      <button type="button" onClick={onClose} aria-label={`Close ${enemy.name}`} className="grid size-11 shrink-0 place-items-center rounded-full text-label-2">
        <span className="grid size-8 place-items-center rounded-full bg-fill"><Icon name="close" /></span>
      </button>
    </div>
  )
}

export function EnemyPageLink({ enemy }: { enemy: Enemy }) {
  return (
    <a href={`#/enemy/${enemy.id}`} className="mt-2 flex h-11 items-center justify-center rounded-control bg-fill text-[15px] font-semibold shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]">
      All numbers
    </a>
  )
}
